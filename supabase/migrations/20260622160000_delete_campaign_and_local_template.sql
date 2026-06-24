-- migration: permitir excluir campanhas de teste e modelos locais (não importados da Meta)

create or replace function public.delete_whatsapp_template_draft(p_template_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.whatsapp_templates%rowtype;
begin
  if not (select private.is_admin((select auth.uid()))) then
    raise exception 'not_admin';
  end if;

  select * into v_row from public.whatsapp_templates where id = p_template_id;

  if not found then
    raise exception 'template_not_found';
  end if;

  if v_row.is_meta_imported then
    raise exception 'template_meta_import_blocked';
  end if;

  delete from public.whatsapp_templates where id = p_template_id;
end;
$$;

comment on function public.delete_whatsapp_template_draft(uuid) is
  'Remove modelos criados no painel (rascunho, pendente, aprovado ou reprovado). Modelos importados da Meta só podem ser arquivados.';

create or replace function public.delete_broadcast_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.broadcast_campaigns%rowtype;
begin
  if not (select private.is_admin((select auth.uid()))) then
    raise exception 'not_admin';
  end if;

  select * into v_row
  from public.broadcast_campaigns
  where id = p_campaign_id;

  if not found then
    raise exception 'campaign_not_found';
  end if;

  if v_row.status = 'sending' then
    raise exception 'campaign_sending_blocked';
  end if;

  delete from public.broadcast_campaigns where id = p_campaign_id;
end;
$$;

comment on function public.delete_broadcast_campaign(uuid) is
  'Exclui campanha de promoção/disparo e dados relacionados (recipients/respostas em cascade). Bloqueia se status=sending.';

grant execute on function public.delete_broadcast_campaign(uuid) to authenticated;
