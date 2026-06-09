-- Reabre campanha para novo disparo (ex.: após corrigir BROADCAST_DRY_RUN ou template)
-- Substitua o UUID abaixo pelo campaign_id

do $$
declare
  v_campaign_id uuid := '412799c7-b9d4-48d3-b683-3439aef3ca3f';
  v_has_failure_reason boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'broadcast_campaign_recipients'
      and column_name = 'failure_reason'
  ) into v_has_failure_reason;

  if v_has_failure_reason then
    update public.broadcast_campaign_recipients
    set
      send_status = 'pending',
      meta_message_id = null,
      sent_at = null,
      delivered_at = null,
      failure_reason = null
    where campaign_id = v_campaign_id
      and send_status = 'failed';
  else
    update public.broadcast_campaign_recipients
    set
      send_status = 'pending',
      meta_message_id = null,
      sent_at = null,
      delivered_at = null
    where campaign_id = v_campaign_id
      and send_status = 'failed';
  end if;

  update public.broadcast_campaigns
  set
    status = 'sending',
    total_sent = 0,
    total_delivered = 0,
    updated_at = now()
  where id = v_campaign_id;

  raise notice 'Campanha % reaberta para retry', v_campaign_id;
end $$;

select id, send_status, sent_at
from public.broadcast_campaign_recipients
where campaign_id = '412799c7-b9d4-48d3-b683-3439aef3ca3f';
