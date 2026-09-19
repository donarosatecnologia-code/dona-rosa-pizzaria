-- purpose: keep broadcast_campaigns.total_sent / total_delivered in sync with
--          recipient send_status (fixes undercounted "entregues" on admin list).
-- affected: public.broadcast_campaigns, public.broadcast_campaign_recipients,
--           public.increment_broadcast_campaign_delivered, new refresh + trigger.

create or replace function public.refresh_broadcast_campaign_counts(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.broadcast_campaigns as campaigns
  set
    total_sent = (
      select count(*)::integer
      from public.broadcast_campaign_recipients as recipients
      where
        recipients.campaign_id = p_campaign_id
        and recipients.send_status in ('sent', 'delivered', 'read')
    ),
    total_delivered = (
      select count(*)::integer
      from public.broadcast_campaign_recipients as recipients
      where
        recipients.campaign_id = p_campaign_id
        and recipients.send_status in ('delivered', 'read')
    ),
    updated_at = now()
  where campaigns.id = p_campaign_id;
end;
$$;

comment on function public.refresh_broadcast_campaign_counts(uuid) is
  'Recalcula total_sent e total_delivered a partir do status real dos destinatários.';

revoke all on function public.refresh_broadcast_campaign_counts(uuid) from public;
revoke all on function public.refresh_broadcast_campaign_counts(uuid) from anon;
revoke all on function public.refresh_broadcast_campaign_counts(uuid) from authenticated;
grant execute on function public.refresh_broadcast_campaign_counts(uuid) to service_role;

-- Backward-compatible: webhook/orchestrator still call increment_*, but we recount.
create or replace function public.increment_broadcast_campaign_delivered(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_broadcast_campaign_counts(p_campaign_id);
end;
$$;

comment on function public.increment_broadcast_campaign_delivered(uuid) is
  'Compat: recalcula entregues/enviados da campanha (não incrementa cegamente).';

create or replace function public.trg_refresh_broadcast_campaign_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_campaign_id uuid;
begin
  target_campaign_id := coalesce(new.campaign_id, old.campaign_id);
  if target_campaign_id is not null then
    perform public.refresh_broadcast_campaign_counts(target_campaign_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists broadcast_recipients_refresh_campaign_counts on public.broadcast_campaign_recipients;

create trigger broadcast_recipients_refresh_campaign_counts
  after insert or update of send_status or delete
  on public.broadcast_campaign_recipients
  for each row
  execute function public.trg_refresh_broadcast_campaign_counts();

-- One-shot reconcile for existing campaigns (ex.: clientes inativos).
do $$
declare
  campaign_row record;
begin
  for campaign_row in
    select id from public.broadcast_campaigns
  loop
    perform public.refresh_broadcast_campaign_counts(campaign_row.id);
  end loop;
end;
$$;
