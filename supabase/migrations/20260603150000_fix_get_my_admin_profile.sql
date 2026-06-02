-- migration: corrigir get_my_admin_profile (403 ao ler auth.users como invoker)
-- purpose: retornar perfil do usuário logado sem violar permissões do schema auth

create or replace function public.get_my_admin_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_row record;
  v_email text;
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

  select a.email
  into v_email
  from auth.users as a
  where a.id = v_uid;

  return jsonb_build_object(
    'id', v_row.id,
    'full_name', v_row.full_name,
    'email', coalesce(v_email, (select auth.jwt() ->> 'email')),
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

-- política explícita: cada admin lê o próprio perfil (evita edge cases de rls)
drop policy if exists "users_select_own_profile" on public.users;

create policy "users_select_own_profile" on public.users
  for select to authenticated
  using (id = (select auth.uid()));
