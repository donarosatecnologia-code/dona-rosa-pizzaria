-- migration: mover register_whatsapp_site_consent para schema private
-- purpose: remover SECURITY DEFINER exposto via PostgREST (/rest/v1/rpc) para anon/authenticated
-- affected: public.register_whatsapp_site_consent → private.register_whatsapp_site_consent
-- notes: o site público passa a chamar a Edge Function register-site-consent (service role)

-- ---------------------------------------------------------------------------
-- função interna (não exposta na API REST pública)
-- ---------------------------------------------------------------------------
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

comment on function private.register_whatsapp_site_consent(text, text, text, text) is
  'Upsert de contato com aceite de termos vindo do site. Chamada apenas via Edge Function (service role).';

revoke all on function private.register_whatsapp_site_consent(text, text, text, text) from public;
revoke all on function private.register_whatsapp_site_consent(text, text, text, text) from anon;
revoke all on function private.register_whatsapp_site_consent(text, text, text, text) from authenticated;
grant execute on function private.register_whatsapp_site_consent(text, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- remover função pública exposta no PostgREST (origem dos warnings do Security Advisor)
-- ---------------------------------------------------------------------------
drop function if exists public.register_whatsapp_site_consent(text, text, text, text);
