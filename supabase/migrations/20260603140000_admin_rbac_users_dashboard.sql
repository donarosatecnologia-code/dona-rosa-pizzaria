-- migration: rbac de administradores, gestão de equipe e stats do dashboard
-- purpose: permissões por módulo, super admin protegido, convites e métricas do início

alter table public.users
  add column if not exists is_super_admin boolean not null default false,
  add column if not exists must_change_password boolean not null default false,
  add column if not exists permissions jsonb not null default '{}'::jsonb;

comment on column public.users.is_super_admin is 'Super admin — não pode ser excluído; acesso total.';
comment on column public.users.must_change_password is 'Força troca de senha no próximo login.';
comment on column public.users.permissions is 'Permissões por módulo: { "modulo": { "view": bool, "edit": bool, "delete": bool } }.';

-- super admin existente
update public.users as u
set
  is_super_admin = true,
  role = 'admin',
  is_active = true
from auth.users as a
where u.id = a.id
  and a.email = 'donarosatecnologia@gmail.com';

-- novos usuários só viram admin se convidados pelo painel
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invited boolean;
  v_permissions jsonb;
begin
  v_invited := coalesce((new.raw_user_meta_data ->> 'invited')::boolean, false);
  v_permissions := coalesce(new.raw_user_meta_data -> 'permissions', '{}'::jsonb);

  insert into public.users (
    id,
    full_name,
    role,
    is_super_admin,
    must_change_password,
    permissions
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    case when v_invited then 'admin' else 'user' end,
    coalesce((new.raw_user_meta_data ->> 'is_super_admin')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'must_change_password')::boolean, false),
    v_permissions
  );

  return new;
end;
$$;

-- permissão granular (super admin bypass)
create or replace function public.admin_has_permission(
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

grant execute on function public.admin_has_permission(uuid, text, text) to authenticated;

-- gestão de equipe
create or replace function public.admin_can_manage_users(_user_id uuid)
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
    or public.admin_has_permission(_user_id, 'usuarios', 'edit');
$$;

grant execute on function public.admin_can_manage_users(uuid) to authenticated;

-- perfil do admin logado
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

  select
    u.id,
    u.full_name,
    u.role,
    u.is_active,
    u.is_super_admin,
    u.must_change_password,
    u.permissions,
    u.last_login_at,
    u.created_at,
    a.email
  into v_row
  from public.users as u
  join auth.users as a on a.id = u.id
  where u.id = v_uid;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'full_name', v_row.full_name,
    'email', v_row.email,
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

grant execute on function public.get_my_admin_profile() to authenticated;

-- atualizar nome próprio (email imutável)
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

  if not public.is_admin(v_uid) then
    raise exception 'not_admin';
  end if;

  update public.users
  set full_name = trim(p_full_name)
  where id = v_uid
    and trim(p_full_name) <> '';
end;
$$;

grant execute on function public.update_my_admin_profile(text) to authenticated;

-- limpar flag após troca de senha
create or replace function public.clear_must_change_password()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.users
  set must_change_password = false,
      last_login_at = now()
  where id = (select auth.uid());
end;
$$;

grant execute on function public.clear_must_change_password() to authenticated;

-- métricas do dashboard
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

  if not public.is_admin(v_uid) then
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
      select coalesce(jsonb_agg(row_to_json(d) order by d.sort_key), '[]'::jsonb)
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
          bc.name,
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

grant execute on function public.get_admin_dashboard_stats() to authenticated;

-- rls em public.users
drop policy if exists "insert_own_profile" on public.users;

create policy "admin_select_users" on public.users
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.admin_can_manage_users((select auth.uid())))
  );

create policy "admin_update_users" on public.users
  for update to authenticated
  using (
    id = (select auth.uid())
    or (select public.admin_can_manage_users((select auth.uid())))
  )
  with check (
    id = (select auth.uid())
    or (select public.admin_can_manage_users((select auth.uid())))
  );

create policy "admin_delete_users" on public.users
  for delete to authenticated
  using (
    (select public.admin_can_manage_users((select auth.uid())))
    and not is_super_admin
    and id <> (select auth.uid())
  );

create policy "service_insert_users" on public.users
  for insert to authenticated
  with check (id = (select auth.uid()));
