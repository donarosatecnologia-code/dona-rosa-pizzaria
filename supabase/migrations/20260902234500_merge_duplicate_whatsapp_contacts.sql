-- migration: unificar cadastros duplicados (planilha vs mensagens) e priorizar importados
-- purpose: merge por telefone normalizado; conversas apontam ao cadastro consolidado

create or replace function public.merge_whatsapp_contact_duplicates()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_canon text;
  v_keeper_id uuid;
  v_dupe_id uuid;
  v_merged integer := 0;
begin
  for v_canon in
    select public.normalize_brazil_phone_e164(wc.phone_number) as canon
    from public.whatsapp_contacts as wc
    where public.normalize_brazil_phone_e164(wc.phone_number) is not null
    group by public.normalize_brazil_phone_e164(wc.phone_number)
    having count(*) > 1
  loop
    select wc.id
    into v_keeper_id
    from public.whatsapp_contacts as wc
    where public.normalize_brazil_phone_e164(wc.phone_number) = v_canon
    order by
      case when wc.import_batch_id is not null then 0 else 1 end,
      coalesce(wc.purchase_count, 0) desc,
      coalesce(wc.last_inbound_at, wc.created_at) desc nulls last,
      wc.created_at
    limit 1;

    for v_dupe_id in
      select wc.id
      from public.whatsapp_contacts as wc
      where public.normalize_brazil_phone_e164(wc.phone_number) = v_canon
        and wc.id <> v_keeper_id
    loop
      update public.whatsapp_contacts as k
      set
        phone_number = v_canon,
        name = case
          when k.import_batch_id is not null then k.name
          when d.import_batch_id is not null then d.name
          else coalesce(nullif(trim(d.name), ''), k.name)
        end,
        email = coalesce(k.email, d.email),
        address_street = coalesce(k.address_street, d.address_street),
        address_number = coalesce(k.address_number, d.address_number),
        address_complement = coalesce(k.address_complement, d.address_complement),
        address_neighborhood = coalesce(k.address_neighborhood, d.address_neighborhood),
        purchase_count = greatest(coalesce(k.purchase_count, 0), coalesce(d.purchase_count, 0)),
        purchase_total = greatest(coalesce(k.purchase_total, 0), coalesce(d.purchase_total, 0)),
        registered_at = coalesce(k.registered_at, d.registered_at),
        last_purchase_at = greatest(k.last_purchase_at, d.last_purchase_at),
        import_batch_id = coalesce(k.import_batch_id, d.import_batch_id),
        import_profile = coalesce(k.import_profile, d.import_profile),
        is_landline = coalesce(k.is_landline, false) or coalesce(d.is_landline, false),
        last_inbound_at = greatest(k.last_inbound_at, d.last_inbound_at),
        inbound_count = greatest(coalesce(k.inbound_count, 0), coalesce(d.inbound_count, 0)),
        terms_accepted_at = coalesce(k.terms_accepted_at, d.terms_accepted_at),
        terms_accepted_source = coalesce(k.terms_accepted_source, d.terms_accepted_source),
        updated_at = now()
      from public.whatsapp_contacts as d
      where k.id = v_keeper_id
        and d.id = v_dupe_id;

      update public.whatsapp_conversations
      set
        whatsapp_contact_id = v_keeper_id,
        contact_removed_at = null,
        updated_at = now()
      where whatsapp_contact_id = v_dupe_id
        or wa_id = v_canon
        or regexp_replace(wa_id, '\D', '', 'g') = regexp_replace(v_canon, '\D', '', 'g');

      delete from public.broadcast_responses as br
      where br.contact_id = v_dupe_id
        and exists (
          select 1
          from public.broadcast_responses as existing
          where existing.contact_id = v_keeper_id
            and existing.campaign_id = br.campaign_id
        );

      update public.broadcast_responses
      set contact_id = v_keeper_id
      where contact_id = v_dupe_id;

      delete from public.broadcast_campaign_recipients as r
      where r.contact_id = v_dupe_id
        and exists (
          select 1
          from public.broadcast_campaign_recipients as existing
          where existing.campaign_id = r.campaign_id
            and existing.contact_id = v_keeper_id
        );

      update public.broadcast_campaign_recipients
      set contact_id = v_keeper_id
      where contact_id = v_dupe_id;

      update public.survey_sessions
      set contact_id = v_keeper_id
      where contact_id = v_dupe_id;

      update public.course_registrations
      set contact_id = v_keeper_id
      where contact_id = v_dupe_id;

      insert into public.whatsapp_contact_tags (contact_id, tag_id, assigned_by)
      select v_keeper_id, wct.tag_id, wct.assigned_by
      from public.whatsapp_contact_tags as wct
      where wct.contact_id = v_dupe_id
      on conflict (contact_id, tag_id) do nothing;

      delete from public.whatsapp_contact_tags
      where contact_id = v_dupe_id;

      delete from public.whatsapp_contacts
      where id = v_dupe_id;

      v_merged := v_merged + 1;
    end loop;
  end loop;

  return v_merged;
end;
$$;

comment on function public.merge_whatsapp_contact_duplicates() is
  'Unifica cadastros com o mesmo telefone (prioriza importação da planilha).';

grant execute on function public.merge_whatsapp_contact_duplicates() to authenticated;

-- prioriza cadastro da planilha ao vincular conversa
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
    returning id into v_contact_id;
  elsif v_name is not null and v_name <> v_phone then
    update public.whatsapp_contacts
    set
      name = v_name,
      updated_at = now()
    where id = v_contact_id
      and import_batch_id is null
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

select public.merge_whatsapp_contact_duplicates();

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
