-- migration: religar conversas após reimportação de contatos
-- purpose: limpar contact_removed_at e vincular whatsapp_contact_id pelo telefone (wa_id)

create or replace function public.relink_whatsapp_conversations_for_phones(p_phones text[] default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with matched as (
    select
      conv.id as conversation_id,
      wc.id as contact_id
    from public.whatsapp_conversations as conv
    inner join public.whatsapp_contacts as wc on wc.phone_number = conv.wa_id
    where conv.deleted_at is null
      and (
        p_phones is null
        or cardinality(p_phones) = 0
        or conv.wa_id = any (p_phones)
      )
  )
  update public.whatsapp_conversations as conv
  set
    whatsapp_contact_id = matched.contact_id,
    contact_removed_at = null,
    updated_at = now()
  from matched
  where conv.id = matched.conversation_id
    and (
      conv.contact_removed_at is not null
      or conv.whatsapp_contact_id is distinct from matched.contact_id
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.relink_whatsapp_conversations_for_phones(text[]) is
  'Religa conversas ao contato pelo telefone; limpa contact_removed_at (uso após importação ou merge).';

grant execute on function public.relink_whatsapp_conversations_for_phones(text[]) to authenticated;

-- exclusão não marca conversa como "cadastro excluído" — só desvincula o contato
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
    whatsapp_contact_id = null,
    updated_at = now()
  where whatsapp_contact_id = p_contact_id;

  delete from public.whatsapp_contacts
  where id = p_contact_id;

  return v_audit_id;
end;
$$;
