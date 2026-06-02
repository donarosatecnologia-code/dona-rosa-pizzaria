-- migration: mover helpers de autorização para schema private (fora da API REST)
-- purpose: eliminar avisos de SECURITY DEFINER exposto em /rest/v1/rpc
-- nota: RLS e funções internas passam a usar private.*; clientes usam am_i_admin / can_i_manage_users

-- ---------------------------------------------------------------------------
-- schema private — não listado em [api].schemas, invisível ao PostgREST
-- ---------------------------------------------------------------------------
create schema if not exists private;

comment on schema private is
  'Funções internas de autorização (RLS). Não expostas na API REST.';

revoke all on schema private from public;
grant usage on schema private to authenticated;
grant usage on schema private to service_role;

-- ---------------------------------------------------------------------------
-- funções definer (mesma lógica anterior, agora fora do public)
-- ---------------------------------------------------------------------------
create or replace function private.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users as u
    where u.id = _user_id
      and u.role = 'admin'
      and u.is_active = true
  );
$$;

create or replace function private.admin_has_permission(
  _user_id uuid,
  _module text,
  _action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_module jsonb;
begin
  select u.is_super_admin, u.role, u.is_active, u.permissions
  into v_row
  from public.users as u
  where u.id = _user_id;

  if not found or not v_row.is_active or v_row.role <> 'admin' then
    return false;
  end if;

  if v_row.is_super_admin then
    return true;
  end if;

  v_module := v_row.permissions -> _module;
  if v_module is null then
    return false;
  end if;

  return coalesce((v_module ->> _action)::boolean, false);
end;
$$;

create or replace function private.admin_can_manage_users(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(
      (
        select u.is_super_admin
        from public.users as u
        where u.id = _user_id
          and u.is_active
          and u.role = 'admin'
      ),
      false
    )
    or private.admin_has_permission(_user_id, 'usuarios', 'edit');
$$;

revoke all on function private.is_admin(uuid) from public;
revoke all on function private.is_admin(uuid) from anon;
grant execute on function private.is_admin(uuid) to authenticated;

revoke all on function private.admin_can_manage_users(uuid) from public;
revoke all on function private.admin_can_manage_users(uuid) from anon;
grant execute on function private.admin_can_manage_users(uuid) to authenticated;

revoke all on function private.admin_has_permission(uuid, text, text) from public;
revoke all on function private.admin_has_permission(uuid, text, text) from anon;
revoke all on function private.admin_has_permission(uuid, text, text) from authenticated;

-- ---------------------------------------------------------------------------
-- atualizar funções public conhecidas (private.is_admin)
-- ---------------------------------------------------------------------------
create or replace function public.publish_page_contents_drafts()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_admin((select auth.uid())) then
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

create or replace function public.publish_broadcast_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  update public.broadcast_campaigns
  set
    template_name = coalesce(template_name_draft, template_name),
    template_params = coalesce(template_params_draft, template_params),
    content_type = coalesce(content_type_draft, content_type),
    queue_id = coalesce(queue_id_draft, queue_id),
    published_at = now(),
    template_name_draft = null,
    template_params_draft = null,
    content_type_draft = null,
    queue_id_draft = null,
    updated_at = now()
  where
    id = p_campaign_id
    and status = 'draft'
    and (
      template_name_draft is not null
      or template_params_draft is not null
      or content_type_draft is not null
      or queue_id_draft is not null
    );

  if not found then
    raise exception 'campaign not found, not in draft, or nothing to publish';
  end if;
end;
$$;

create or replace function public.get_admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid;
  v_result jsonb;
begin
  v_uid := (select auth.uid());

  if not private.is_admin(v_uid) then
    raise exception 'not_admin';
  end if;

  select jsonb_build_object(
    'products_count', (select count(*)::int from public.products),
    'categories_count', (select count(*)::int from public.categories),
    'contents_count', (select count(*)::int from public.page_contents),
    'contacts_count', (
      select count(*)::int
      from public.whatsapp_contacts
      where deleted_at is null
    ),
    'conversations_open', (
      select count(*)::int
      from public.whatsapp_conversations
      where deleted_at is null
        and status = 'open'
    ),
    'conversations_waiting', (
      select count(*)::int
      from public.whatsapp_conversations
      where deleted_at is null
        and status <> 'closed'
        and last_message_direction = 'inbound'
    ),
    'conversations_by_status', (
      select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb)
      from (
        select c.status as name, count(*)::int as value
        from public.whatsapp_conversations as c
        where c.deleted_at is null
        group by c.status
      ) as s
    ),
    'messages_by_day', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'day', d.day,
            'inbound', d.inbound,
            'outbound', d.outbound
          )
          order by d.sort_key
        ),
        '[]'::jsonb
      )
      from (
        select
          date_trunc('day', m.created_at at time zone 'America/Sao_Paulo') as sort_key,
          to_char(date_trunc('day', m.created_at at time zone 'America/Sao_Paulo'), 'DD/MM') as day,
          count(*) filter (where m.direction = 'inbound')::int as inbound,
          count(*) filter (where m.direction = 'outbound')::int as outbound
        from public.whatsapp_messages as m
        where m.created_at >= now() - interval '7 days'
        group by date_trunc('day', m.created_at at time zone 'America/Sao_Paulo')
      ) as d
    ),
    'campaigns_summary', (
      select coalesce(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      from (
        select
          bc.id,
          coalesce(nullif(trim(bc.template_name), ''), nullif(trim(bc.template_name_draft), ''), 'Campanha') as name,
          bc.status,
          bc.total_sent,
          bc.total_delivered,
          bc.created_at
        from public.broadcast_campaigns as bc
        order by bc.created_at desc
        limit 5
      ) as c
    ),
    'templates_approved', (
      select count(*)::int
      from public.whatsapp_templates
      where status = 'approved'
    )
  )
  into v_result;

  return v_result;
end;
$$;

create or replace function public.update_my_admin_profile(p_full_name text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := (select auth.uid());

  if not private.is_admin(v_uid) then
    raise exception 'not_admin';
  end if;

  update public.users
  set full_name = trim(p_full_name)
  where id = v_uid
    and trim(p_full_name) <> '';
end;
$$;

create or replace function public.dismiss_whatsapp_notifications(p_notification_ids uuid[] default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_count integer;
begin
  v_user_id := (select auth.uid());

  if not (select private.is_admin(v_user_id)) then
    raise exception 'not_admin';
  end if;

  if p_notification_ids is null then
    insert into public.whatsapp_notification_dismissals (notification_id, user_id)
    select n.id, v_user_id
    from public.whatsapp_admin_notifications as n
    where not exists (
      select 1
      from public.whatsapp_notification_dismissals as d
      where d.notification_id = n.id
        and d.user_id = v_user_id
    )
    on conflict (notification_id, user_id) do nothing;

    get diagnostics v_count = row_count;
    return v_count;
  end if;

  insert into public.whatsapp_notification_dismissals (notification_id, user_id)
  select unnest(p_notification_ids), v_user_id
  on conflict (notification_id, user_id) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.mark_whatsapp_notifications_read(p_notification_ids uuid[] default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_count integer;
begin
  v_user_id := (select auth.uid());

  if not (select private.is_admin(v_user_id)) then
    raise exception 'not_admin';
  end if;

  if p_notification_ids is null then
    insert into public.whatsapp_notification_reads (notification_id, user_id)
    select n.id, v_user_id
    from public.whatsapp_admin_notifications as n
    where n.created_at > now() - interval '7 days'
    on conflict (notification_id, user_id) do nothing;

    get diagnostics v_count = row_count;
    return v_count;
  end if;

  insert into public.whatsapp_notification_reads (notification_id, user_id)
  select unnest(p_notification_ids), v_user_id
  on conflict (notification_id, user_id) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

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

create or replace function public.archive_whatsapp_template(p_template_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_admin((select auth.uid()))) then
    raise exception 'not_admin';
  end if;

  update public.whatsapp_templates
  set archived_at = now(), updated_at = now()
  where id = p_template_id and archived_at is null;

  if not found then
    raise exception 'template_not_found';
  end if;
end;
$$;

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

  if v_row.status not in ('draft', 'rejected') then
    raise exception 'template_not_deletable';
  end if;

  delete from public.whatsapp_templates where id = p_template_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- atualizar policies (public + storage) para private.*
-- ---------------------------------------------------------------------------
do $$
declare
  v_rec record;
  v_qual text;
  v_check text;
  v_roles text;
  v_sql text;
begin
  for v_rec in
    select
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    from pg_policies
    where schemaname in ('public', 'storage', 'realtime')
      and (
        coalesce(qual, '') ~ '(^|[^a-z_])is_admin\(|public\.is_admin\(|public\.admin_can_manage_users\('
        or coalesce(with_check, '') ~ '(^|[^a-z_])is_admin\(|public\.is_admin\(|public\.admin_can_manage_users\('
      )
  loop
    v_qual := coalesce(v_rec.qual, '');
    v_check := coalesce(v_rec.with_check, '');

    v_qual := replace(v_qual, 'public.is_admin(', 'private.is_admin(');
    v_qual := replace(v_qual, 'public.admin_can_manage_users(', 'private.admin_can_manage_users(');
    v_qual := regexp_replace(v_qual, '(?<![a-z_.])is_admin\(', 'private.is_admin(', 'g');

    v_check := replace(v_check, 'public.is_admin(', 'private.is_admin(');
    v_check := replace(v_check, 'public.admin_can_manage_users(', 'private.admin_can_manage_users(');
    v_check := regexp_replace(v_check, '(?<![a-z_.])is_admin\(', 'private.is_admin(', 'g');

    select string_agg(quote_ident(role_name::text), ', ')
    into v_roles
    from unnest(v_rec.roles) as role_name;

    execute format(
      'drop policy if exists %I on %I.%I',
      v_rec.policyname,
      v_rec.schemaname,
      v_rec.tablename
    );

    v_sql := format(
      'create policy %I on %I.%I as %s for %s to %s',
      v_rec.policyname,
      v_rec.schemaname,
      v_rec.tablename,
      v_rec.permissive,
      v_rec.cmd,
      v_roles
    );

    if v_qual <> '' then
      v_sql := v_sql || format(' using (%s)', v_qual);
    end if;

    if v_check <> '' then
      v_sql := v_sql || format(' with check (%s)', v_check);
    end if;

    execute v_sql;
  end loop;
end;
$$;

-- policies críticas (users + realtime) — garantia explícita além do loop
drop policy if exists "admin_select_users" on public.users;
create policy "admin_select_users" on public.users
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.admin_can_manage_users((select auth.uid())))
  );

drop policy if exists "admin_update_users" on public.users;
create policy "admin_update_users" on public.users
  for update to authenticated
  using (
    id = (select auth.uid())
    or (select private.admin_can_manage_users((select auth.uid())))
  )
  with check (
    id = (select auth.uid())
    or (select private.admin_can_manage_users((select auth.uid())))
  );

drop policy if exists "admin_delete_users" on public.users;
create policy "admin_delete_users" on public.users
  for delete to authenticated
  using (
    (select private.admin_can_manage_users((select auth.uid())))
    and not is_super_admin
    and id <> (select auth.uid())
  );

drop policy if exists "admin_receive_whatsapp_broadcast_realtime" on realtime.messages;
create policy "admin_receive_whatsapp_broadcast_realtime" on realtime.messages
  for select to authenticated
  using (
    topic = 'admin:whatsapp:broadcasts'
    and (select private.is_admin((select auth.uid())))
  );

drop policy if exists "admin_write_whatsapp_broadcast_realtime" on realtime.messages;
create policy "admin_write_whatsapp_broadcast_realtime" on realtime.messages
  for insert to authenticated
  with check (
    topic = 'admin:whatsapp:broadcasts'
    and (select private.is_admin((select auth.uid())))
  );

-- ---------------------------------------------------------------------------
-- wrappers públicos (SECURITY INVOKER) — única superfície exposta via RPC
-- ---------------------------------------------------------------------------
drop function if exists public.is_admin(uuid);
drop function if exists public.admin_can_manage_users(uuid);
drop function if exists public.admin_has_permission(uuid, text, text);

create or replace function public.am_i_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin((select auth.uid()));
$$;

create or replace function public.can_i_manage_users()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.admin_can_manage_users((select auth.uid()));
$$;

revoke all on function public.am_i_admin() from public;
revoke all on function public.am_i_admin() from anon;
grant execute on function public.am_i_admin() to authenticated;

revoke all on function public.can_i_manage_users() from public;
revoke all on function public.can_i_manage_users() from anon;
grant execute on function public.can_i_manage_users() to authenticated;
