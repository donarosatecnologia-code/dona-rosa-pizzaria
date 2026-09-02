-- migration: garantir cadastro de cliente para cada conversa WhatsApp
-- purpose: criar ou vincular whatsapp_contacts por telefone (com normalização) ao abrir conversa

create or replace function public.ensure_whatsapp_conversation_contact_inner(p_conversation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conv record;
  v_phone text;
  v_digits text;
  v_contact_id uuid;
  v_name text;
begin
  select
    id,
    wa_id,
    contact_name,
    whatsapp_contact_id
  into v_conv
  from public.whatsapp_conversations
  where id = p_conversation_id
    and deleted_at is null;

  if not found then
    return null;
  end if;

  v_phone := public.normalize_brazil_phone_e164(v_conv.wa_id);
  v_digits := regexp_replace(coalesce(v_conv.wa_id, ''), '\D', '', 'g');

  if v_phone is null and length(v_digits) > 0 then
    v_phone := v_digits;
  end if;

  if v_phone is null or length(v_phone) = 0 then
    return v_conv.whatsapp_contact_id;
  end if;

  select wc.id
  into v_contact_id
  from public.whatsapp_contacts as wc
  where wc.phone_number = v_conv.wa_id
    or wc.phone_number = v_phone
    or regexp_replace(wc.phone_number, '\D', '', 'g') = v_digits
    or (
      public.normalize_brazil_phone_e164(wc.phone_number) is not null
      and public.normalize_brazil_phone_e164(wc.phone_number) = v_phone
    )
  order by
    case when wc.phone_number = v_phone then 0 else 1 end,
    wc.created_at
  limit 1;

  v_name := nullif(trim(coalesce(v_conv.contact_name, '')), '');

  if v_contact_id is null then
    insert into public.whatsapp_contacts (
      phone_number,
      name,
      status,
      registered_at
    )
    values (
      v_phone,
      coalesce(v_name, v_phone),
      'active',
      current_date
    )
    returning id into v_contact_id;
  elsif v_name is not null and v_name <> v_phone then
    update public.whatsapp_contacts
    set
      name = v_name,
      updated_at = now()
    where id = v_contact_id
      and (
        name is null
        or name = phone_number
        or name = v_phone
        or name = v_digits
      );
  end if;

  update public.whatsapp_conversations
  set
    whatsapp_contact_id = v_contact_id,
    contact_removed_at = null,
    updated_at = now()
  where id = p_conversation_id
    and (
      whatsapp_contact_id is distinct from v_contact_id
      or contact_removed_at is not null
    );

  return v_contact_id;
end;
$$;

create or replace function public.ensure_whatsapp_conversation_contact(p_conversation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin((select auth.uid()))) then
    raise exception 'not_admin';
  end if;

  return public.ensure_whatsapp_conversation_contact_inner(p_conversation_id);
end;
$$;

comment on function public.ensure_whatsapp_conversation_contact(uuid) is
  'Cria ou vincula cadastro de cliente à conversa pelo telefone (normalizado).';

grant execute on function public.ensure_whatsapp_conversation_contact(uuid) to authenticated;

revoke all on function public.ensure_whatsapp_conversation_contact_inner(uuid) from public;
revoke all on function public.ensure_whatsapp_conversation_contact_inner(uuid) from anon;
revoke all on function public.ensure_whatsapp_conversation_contact_inner(uuid) from authenticated;

-- backfill: todas as conversas ativas
do $$
declare
  v_conversation_id uuid;
begin
  for v_conversation_id in
    select id
    from public.whatsapp_conversations
    where deleted_at is null
  loop
    perform public.ensure_whatsapp_conversation_contact_inner(v_conversation_id);
  end loop;
end;
$$;
