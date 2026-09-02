-- migration: inscrições em cursos/eventos + fonte site_course
-- purpose: gravar inscrições no banco em vez de abrir wa.me para número pessoal

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
      'csv_import'
    )
  );

create table if not exists public.course_registrations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.whatsapp_contacts (id) on delete set null,
  event_type text not null,
  name text not null,
  phone text not null,
  email text,
  preferred_date date not null,
  preferred_time text not null,
  created_at timestamptz not null default now()
);

comment on table public.course_registrations is
  'Inscrições enviadas pelo formulário de /cursos-e-eventos.';

create index if not exists idx_course_registrations_created_at
  on public.course_registrations using btree (created_at desc);

alter table public.course_registrations enable row level security;

create policy "admin_select_course_registrations" on public.course_registrations
  for select to authenticated
  using ((select private.is_admin((select auth.uid()))));

-- aceita site_course na função interna de consentimento
create or replace function private.register_whatsapp_site_consent(
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

  if v_source not in ('site_widget', 'site_contact_form', 'site_reserve', 'site_course') then
    v_source := 'site_widget';
  end if;

  insert into public.whatsapp_contacts (
    name,
    phone_number,
    email,
    status,
    terms_accepted_at,
    terms_accepted_source,
    registered_at
  )
  values (
    v_name,
    v_phone,
    v_email,
    'active',
    now(),
    v_source,
    current_date
  )
  on conflict (phone_number) do update
  set
    name = excluded.name,
    email = coalesce(excluded.email, public.whatsapp_contacts.email),
    terms_accepted_at = coalesce(public.whatsapp_contacts.terms_accepted_at, now()),
    terms_accepted_source = coalesce(public.whatsapp_contacts.terms_accepted_source, excluded.terms_accepted_source),
    registered_at = coalesce(public.whatsapp_contacts.registered_at, current_date),
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
