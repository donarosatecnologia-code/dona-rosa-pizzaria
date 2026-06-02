-- migration: security advisor hardening
-- purpose: endereçar avisos do Security Advisor sem alterar comportamento da plataforma
--   1) remove policy de listagem no bucket público images (urls diretas continuam funcionando)
--   2) revoga EXECUTE de anon/public em funções internas e SECURITY DEFINER expostas
--   3) converte RPCs de admin para SECURITY INVOKER onde seguro
--   4) restringe funções de webhook/trigger a service_role ou execução interna

-- ---------------------------------------------------------------------------
-- storage: bucket images é público — SELECT amplo permite listar todos os arquivos
-- getPublicUrl / upload / remove não dependem desta policy
-- ---------------------------------------------------------------------------
drop policy if exists "public_read_images" on storage.objects;

-- ---------------------------------------------------------------------------
-- get_my_admin_profile: invoker + e-mail do jwt (evita SECURITY DEFINER exposto)
-- ---------------------------------------------------------------------------
create or replace function public.get_my_admin_profile()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid;
  v_row record;
begin
  v_uid := (select auth.uid());

  if v_uid is null then
    return null;
  end if;

  select
    u.id,
    u.full_name,
    u.role,
    u.is_active,
    u.is_super_admin,
    u.must_change_password,
    u.permissions,
    u.last_login_at,
    u.created_at
  into v_row
  from public.users as u
  where u.id = v_uid;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'full_name', v_row.full_name,
    'email', coalesce((select auth.jwt() ->> 'email'), ''),
    'role', v_row.role,
    'is_active', v_row.is_active,
    'is_super_admin', v_row.is_super_admin,
    'must_change_password', v_row.must_change_password,
    'permissions', v_row.permissions,
    'last_login_at', v_row.last_login_at,
    'created_at', v_row.created_at
  );
end;
$$;

revoke all on function public.get_my_admin_profile() from public;
revoke all on function public.get_my_admin_profile() from anon;
grant execute on function public.get_my_admin_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- publish_*: invoker — RLS de admin já protege as tabelas
-- ---------------------------------------------------------------------------
create or replace function public.publish_page_contents_drafts()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  update public.page_contents
  set
    title = coalesce(title_draft, title),
    content = coalesce(content_draft, content),
    image_url = coalesce(image_url_draft, image_url),
    content_published_at = now(),
    title_draft = null,
    content_draft = null,
    image_url_draft = null,
    updated_at = now()
  where
    title_draft is not null
    or content_draft is not null
    or image_url_draft is not null;
end;
$$;

revoke all on function public.publish_page_contents_drafts() from public;
revoke all on function public.publish_page_contents_drafts() from anon;
grant execute on function public.publish_page_contents_drafts() to authenticated;

create or replace function public.publish_broadcast_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  update public.broadcast_campaigns
  set
    template_name = coalesce(template_name_draft, template_name),
    template_params = coalesce(template_params_draft, template_params),
    published_at = now(),
    template_name_draft = null,
    template_params_draft = null,
    updated_at = now()
  where
    id = p_campaign_id
    and status = 'draft'
    and (
      template_name_draft is not null
      or template_params_draft is not null
    );

  if not found then
    raise exception 'campaign not found, not in draft, or nothing to publish';
  end if;
end;
$$;

revoke all on function public.publish_broadcast_campaign(uuid) from public;
revoke all on function public.publish_broadcast_campaign(uuid) from anon;
grant execute on function public.publish_broadcast_campaign(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- is_admin + admin_can_manage_users: SECURITY DEFINER necessário para RLS
-- apenas authenticated pode executar via API
-- ---------------------------------------------------------------------------
revoke all on function public.is_admin(uuid) from public;
revoke all on function public.is_admin(uuid) from anon;
grant execute on function public.is_admin(uuid) to authenticated;

revoke all on function public.admin_can_manage_users(uuid) from public;
revoke all on function public.admin_can_manage_users(uuid) from anon;
grant execute on function public.admin_can_manage_users(uuid) to authenticated;

-- admin_has_permission: só chamada por outras funções definer, não expor via RPC
revoke all on function public.admin_has_permission(uuid, text, text) from public;
revoke all on function public.admin_has_permission(uuid, text, text) from anon;
revoke all on function public.admin_has_permission(uuid, text, text) from authenticated;

-- ---------------------------------------------------------------------------
-- triggers: revogar execução de clientes (disparo continua pelo owner postgres)
-- ---------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

revoke all on function public.update_conversation_on_new_message() from public;
revoke all on function public.update_conversation_on_new_message() from anon;
revoke all on function public.update_conversation_on_new_message() from authenticated;

revoke all on function public.notify_whatsapp_inbound_message() from public;
revoke all on function public.notify_whatsapp_inbound_message() from anon;
revoke all on function public.notify_whatsapp_inbound_message() from authenticated;

revoke all on function public.notify_whatsapp_crm_message() from public;
revoke all on function public.notify_whatsapp_crm_message() from anon;
revoke all on function public.notify_whatsapp_crm_message() from authenticated;

revoke all on function public.notify_survey_response_created() from public;
revoke all on function public.notify_survey_response_created() from anon;
revoke all on function public.notify_survey_response_created() from authenticated;

revoke all on function public.notify_broadcast_response_created() from public;
revoke all on function public.notify_broadcast_response_created() from anon;
revoke all on function public.notify_broadcast_response_created() from authenticated;

-- ---------------------------------------------------------------------------
-- webhooks / edge functions: apenas service_role
-- ---------------------------------------------------------------------------
revoke all on function public.increment_broadcast_campaign_delivered(uuid) from public;
revoke all on function public.increment_broadcast_campaign_delivered(uuid) from anon;
revoke all on function public.increment_broadcast_campaign_delivered(uuid) from authenticated;
grant execute on function public.increment_broadcast_campaign_delivered(uuid) to service_role;

revoke all on function public.refresh_contact_engagement(uuid) from public;
revoke all on function public.refresh_contact_engagement(uuid) from anon;
revoke all on function public.refresh_contact_engagement(uuid) from authenticated;
grant execute on function public.refresh_contact_engagement(uuid) to service_role;

revoke all on function public.upsert_whatsapp_config_active(text, text) from public;
revoke all on function public.upsert_whatsapp_config_active(text, text) from anon;
revoke all on function public.upsert_whatsapp_config_active(text, text) from authenticated;
grant execute on function public.upsert_whatsapp_config_active(text, text) to service_role;

-- função interna da plataforma supabase (se existir no projeto)
do $$
begin
  if exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and p.pronargs = 0
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public';
    execute 'revoke all on function public.rls_auto_enable() from anon';
    execute 'revoke all on function public.rls_auto_enable() from authenticated';
  end if;
end;
$$;
