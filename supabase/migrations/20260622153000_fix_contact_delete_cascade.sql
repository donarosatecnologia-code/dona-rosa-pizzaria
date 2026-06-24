-- migration: corrigir exclusão de contatos com histórico de campanhas
-- purpose: delete_whatsapp_contact_with_audit falhava por FK restrict em
--   broadcast_campaign_recipients e broadcast_responses

create or replace function public.delete_whatsapp_contact_with_audit(
  p_contact_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_contact public.whatsapp_contacts%rowtype;
  v_audit_id uuid;
  v_user_id uuid;
begin
  if not (select private.is_admin((select auth.uid()))) then
    raise exception 'not_admin';
  end if;

  v_user_id := (select auth.uid());

  select * into v_contact
  from public.whatsapp_contacts
  where id = p_contact_id;

  if not found then
    raise exception 'contact_not_found';
  end if;

  -- registros de campanha impediam o delete (on delete restrict)
  delete from public.broadcast_responses
  where contact_id = p_contact_id;

  delete from public.broadcast_campaign_recipients
  where contact_id = p_contact_id;

  insert into public.whatsapp_contact_deletion_audit (
    phone_number,
    name,
    deleted_by,
    reason,
    contact_snapshot
  )
  values (
    v_contact.phone_number,
    v_contact.name,
    v_user_id,
    p_reason,
    to_jsonb(v_contact)
  )
  returning id into v_audit_id;

  update public.whatsapp_conversations
  set
    contact_removed_at = now(),
    whatsapp_contact_id = null,
    updated_at = now()
  where whatsapp_contact_id = p_contact_id;

  delete from public.whatsapp_contacts
  where id = p_contact_id;

  return v_audit_id;
end;
$$;

comment on function public.delete_whatsapp_contact_with_audit(uuid, text) is
  'Remove contato da lista com auditoria LGPD; limpa recipients/respostas de campanha antes do delete.';
