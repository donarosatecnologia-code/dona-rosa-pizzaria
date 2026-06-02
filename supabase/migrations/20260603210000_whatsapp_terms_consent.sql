-- migration: consentimento termos whatsapp (site + primeira mensagem)
-- purpose: registrar aceite do site e controlar prompt na primeira conversa whatsapp
-- affected: public.whatsapp_contacts, public.resolve_queue_contact_ids

-- ---------------------------------------------------------------------------
-- colunas de consentimento em whatsapp_contacts
-- ---------------------------------------------------------------------------
alter table public.whatsapp_contacts
  add column if not exists email text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_accepted_source text,
  add column if not exists terms_prompt_sent_at timestamptz;

alter table public.whatsapp_contacts
  drop constraint if exists whatsapp_contacts_terms_accepted_source_check;

alter table public.whatsapp_contacts
  add constraint whatsapp_contacts_terms_accepted_source_check check (
    terms_accepted_source is null
    or terms_accepted_source in ('site_widget', 'site_contact_form', 'site_reserve', 'whatsapp')
  );

comment on column public.whatsapp_contacts.email is
  'E-mail informado no formulário de contato do site (opcional).';
comment on column public.whatsapp_contacts.terms_accepted_at is
  'Momento em que o contato aceitou Termos de Uso e Política de Privacidade.';
comment on column public.whatsapp_contacts.terms_accepted_source is
  'Canal do aceite: site_* ou whatsapp (botão na primeira mensagem).';
comment on column public.whatsapp_contacts.terms_prompt_sent_at is
  'Quando enviamos o pedido de confirmação de termos no WhatsApp.';

create index if not exists idx_whatsapp_contacts_terms_accepted_at
  on public.whatsapp_contacts using btree (terms_accepted_at)
  where terms_accepted_at is not null;

-- ---------------------------------------------------------------------------
-- normalização e164 (espelha src/lib/whatsapp/normalizePhone.ts)
-- ---------------------------------------------------------------------------
create or replace function public.normalize_brazil_phone_e164(p_input text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_digits text;
  v_national text;
begin
  v_digits := regexp_replace(coalesce(p_input, ''), '\D', '', 'g');

  if length(v_digits) = 0 then
    return null;
  end if;

  if not v_digits like '55%' then
    if length(v_digits) >= 10 and length(v_digits) <= 11 then
      v_digits := '55' || v_digits;
    else
      return null;
    end if;
  end if;

  v_national := substring(v_digits from 3);

  if length(v_national) = 10 then
    v_digits := '55' || substring(v_national from 1 for 2) || '9' || substring(v_national from 3);
  end if;

  v_national := substring(v_digits from 3);

  if length(v_national) < 10 or length(v_national) > 11 then
    return null;
  end if;

  return v_digits;
end;
$$;

comment on function public.normalize_brazil_phone_e164(text) is
  'Normaliza telefone BR para E.164 sem + (ex.: 5511999998888).';

-- ---------------------------------------------------------------------------
-- registro público de consentimento via site (security definer)
-- ---------------------------------------------------------------------------
create or replace function public.register_whatsapp_site_consent(
  p_name text,
  p_phone text,
  p_email text default null,
  p_source text default 'site_widget'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text;
  v_name text;
  v_email text;
  v_source text;
  v_contact_id uuid;
begin
  v_phone := public.normalize_brazil_phone_e164(p_phone);
  if v_phone is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;

  v_name := nullif(trim(coalesce(p_name, '')), '');
  if v_name is null then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;

  v_email := nullif(trim(coalesce(p_email, '')), '');
  v_source := coalesce(nullif(trim(p_source), ''), 'site_widget');

  if v_source not in ('site_widget', 'site_contact_form', 'site_reserve') then
    v_source := 'site_widget';
  end if;

  insert into public.whatsapp_contacts (
    name,
    phone_number,
    email,
    status,
    terms_accepted_at,
    terms_accepted_source
  )
  values (
    v_name,
    v_phone,
    v_email,
    'active',
    now(),
    v_source
  )
  on conflict (phone_number) do update
  set
    name = excluded.name,
    email = coalesce(excluded.email, public.whatsapp_contacts.email),
    terms_accepted_at = coalesce(public.whatsapp_contacts.terms_accepted_at, now()),
    terms_accepted_source = coalesce(public.whatsapp_contacts.terms_accepted_source, excluded.terms_accepted_source),
    updated_at = now()
  returning id into v_contact_id;

  return jsonb_build_object(
    'ok', true,
    'contact_id', v_contact_id,
    'phone_number', v_phone,
    'terms_accepted', true
  );
end;
$$;

comment on function public.register_whatsapp_site_consent(text, text, text, text) is
  'Upsert de contato com aceite de termos vindo do site (formulário ou widget WhatsApp).';

revoke all on function public.register_whatsapp_site_consent(text, text, text, text) from public;
grant execute on function public.register_whatsapp_site_consent(text, text, text, text) to anon;
grant execute on function public.register_whatsapp_site_consent(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- filas: só contatos com termos aceitos entram em disparos
-- ---------------------------------------------------------------------------
create or replace function public.resolve_queue_contact_ids(p_queue_id uuid)
returns setof uuid
language sql
stable
security invoker
set search_path = ''
as $$
  with queue_rules as (
    select
      q.id,
      q.include_match,
      q.exclude_match,
      coalesce(
        (
          select array_agg(qt.tag_id)
          from public.whatsapp_queue_tags as qt
          where qt.queue_id = q.id and qt.rule_type = 'include'
        ),
        array[]::uuid[]
      ) as include_tag_ids,
      coalesce(
        (
          select array_agg(qt.tag_id)
          from public.whatsapp_queue_tags as qt
          where qt.queue_id = q.id and qt.rule_type = 'exclude'
        ),
        array[]::uuid[]
      ) as exclude_tag_ids
    from public.whatsapp_queues as q
    where q.id = p_queue_id and q.is_active = true
  ),
  contact_tags as (
    select
      c.id as contact_id,
      coalesce(array_agg(ct.tag_id) filter (where ct.tag_id is not null), array[]::uuid[]) as tag_ids
    from public.whatsapp_contacts as c
    left join public.whatsapp_contact_tags as ct on ct.contact_id = c.id
    where c.status = 'active'
      and c.terms_accepted_at is not null
    group by c.id
  )
  select ct.contact_id
  from contact_tags as ct
  cross join queue_rules as qr
  where
    qr.id is not null
    and (
      cardinality(qr.include_tag_ids) = 0
      or (
        qr.include_match = 'any'
        and ct.tag_ids && qr.include_tag_ids
      )
      or (
        qr.include_match = 'all'
        and qr.include_tag_ids <@ ct.tag_ids
      )
    )
    and (
      cardinality(qr.exclude_tag_ids) = 0
      or not (
        qr.exclude_match = 'any'
        and ct.tag_ids && qr.exclude_tag_ids
      )
    );
$$;

comment on function public.resolve_queue_contact_ids(uuid) is
  'Retorna IDs de contatos active com termos aceitos que pertencem à fila conforme tags include/exclude.';
