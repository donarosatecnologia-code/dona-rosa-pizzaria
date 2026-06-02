-- migration: exclusão de notificações por usuário (visão individual)
-- purpose: permitir que cada admin oculte notificações sem afetar outros logins

create table if not exists public.whatsapp_notification_dismissals (
  notification_id uuid not null references public.whatsapp_admin_notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

comment on table public.whatsapp_notification_dismissals is
  'Notificações ocultadas pelo admin — escopo individual (não remove para outros usuários).';

create index if not exists idx_whatsapp_notification_dismissals_user
  on public.whatsapp_notification_dismissals using btree (user_id, dismissed_at desc);

alter table public.whatsapp_notification_dismissals enable row level security;

create policy "admin_select_own_notification_dismissals" on public.whatsapp_notification_dismissals
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "admin_insert_own_notification_dismissals" on public.whatsapp_notification_dismissals
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_admin((select auth.uid())))
  );

create policy "admin_delete_own_notification_dismissals" on public.whatsapp_notification_dismissals
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ocultar uma ou todas as notificações visíveis para o usuário atual
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

  if not (select public.is_admin(v_user_id)) then
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

grant execute on function public.dismiss_whatsapp_notifications(uuid[]) to authenticated;
