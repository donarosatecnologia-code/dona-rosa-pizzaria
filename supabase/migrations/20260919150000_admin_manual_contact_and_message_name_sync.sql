-- Permite consentimento LGPD ao cadastrar cliente único no admin.
-- Também atualiza o vínculo conversa→contato para sempre usar o nome
-- vindo das mensagens (fonte mais recente).

alter table public.whatsapp_contacts
  drop constraint if exists whatsapp_contacts_terms_accepted_source_check;

alter table public.whatsapp_contacts
  add constraint whatsapp_contacts_terms_accepted_source_check check (
    terms_accepted_source is null
    or terms_accepted_source in (
      'site_widget',
      'site_contact_form',
      'site_reserve',
      'site_course',
      'whatsapp',
      'csv_import',
      'admin_manual'
    )
  );

comment on column public.whatsapp_contacts.terms_accepted_source is
  'Origem do consentimento LGPD: site, whatsapp, csv_import, admin_manual.';

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
    case when wc.import_batch_id is not null then 0 else 1 end,
    coalesce(wc.purchase_count, 0) desc,
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
    on conflict (phone_number) do update
      set
        name = coalesce(excluded.name, public.whatsapp_contacts.name),
        updated_at = now()
    returning id into v_contact_id;
  elsif v_name is not null and v_name <> v_phone and v_name <> v_digits then
    -- Mensagens são a fonte mais recente: atualiza o nome sempre.
    update public.whatsapp_contacts
    set
      name = v_name,
      updated_at = now()
    where id = v_contact_id
      and name is distinct from v_name;
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

comment on function public.ensure_whatsapp_conversation_contact_inner(uuid) is
  'Vincula conversa a contato por telefone; cria se necessário e atualiza o nome com o da mensagem.';
