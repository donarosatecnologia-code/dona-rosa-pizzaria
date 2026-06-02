-- migration: inbox bidirecional, notificações, horário comercial, auditoria LGPD
-- purpose: suportar resposta na janela 24h, fila de atendimento, notificações persistidas,
--   exclusão de contato com trilha de auditoria, arquivamento de modelos

-- ---------------------------------------------------------------------------
-- whatsapp_conversations — campos de fila e janela de atendimento
-- ---------------------------------------------------------------------------
alter table public.whatsapp_conversations
  add column if not exists last_inbound_at timestamptz,
  add column if not exists last_outbound_at timestamptz,
  add column if not exists last_message_direction text,
  add column if not exists contact_removed_at timestamptz;

comment on column public.whatsapp_conversations.last_inbound_at is
  'Última mensagem inbound — base para janela de 24h Meta.';
comment on column public.whatsapp_conversations.last_message_direction is
  'Direção da última mensagem (inbound/outbound) — fila Aguardando.';
comment on column public.whatsapp_conversations.contact_removed_at is
  'Preenchido quando contato foi excluído da base (hard delete LGPD).';

alter table public.whatsapp_conversations
  drop constraint if exists whatsapp_conversations_last_message_direction_check;

alter table public.whatsapp_conversations
  add constraint whatsapp_conversations_last_message_direction_check check (
    last_message_direction is null or last_message_direction in ('inbound', 'outbound')
  );

create index if not exists idx_whatsapp_conversations_last_inbound_at
  on public.whatsapp_conversations using btree (last_inbound_at desc nulls last);

create index if not exists idx_whatsapp_conversations_queue
  on public.whatsapp_conversations using btree (status, last_inbound_at desc nulls last)
  where deleted_at is null and last_message_direction = 'inbound';

-- ---------------------------------------------------------------------------
-- whatsapp_templates — arquivar / importados Meta
-- ---------------------------------------------------------------------------
alter table public.whatsapp_templates
  add column if not exists archived_at timestamptz,
  add column if not exists is_meta_imported boolean not null default false;

comment on column public.whatsapp_templates.is_meta_imported is
  'true = veio da Meta (ex.: hello_world) — exclusão bloqueada na UI.';

-- ---------------------------------------------------------------------------
-- whatsapp_business_hours — expediente configurável (0=domingo … 6=sábado)
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_business_hours (
  id bigint generated always as identity primary key,
  day_of_week smallint not null,
  is_open boolean not null default true,
  open_time time,
  close_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_business_hours_day_unique unique (day_of_week),
  constraint whatsapp_business_hours_day_check check (day_of_week between 0 and 6)
);

comment on table public.whatsapp_business_hours is
  'Horário de atendimento WhatsApp — aviso na fila (não bloqueia envio).';

insert into public.whatsapp_business_hours (day_of_week, is_open, open_time, close_time)
values
  (0, false, null, null),
  (1, true, '18:00', '23:30'),
  (2, true, '18:00', '23:30'),
  (3, true, '18:00', '23:30'),
  (4, true, '18:00', '23:30'),
  (5, true, '18:00', '23:30'),
  (6, true, '18:00', '23:30')
on conflict (day_of_week) do nothing;

alter table public.whatsapp_business_hours enable row level security;

create policy "admin_select_whatsapp_business_hours" on public.whatsapp_business_hours
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_business_hours" on public.whatsapp_business_hours
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

drop trigger if exists set_updated_at_whatsapp_business_hours on public.whatsapp_business_hours;
create trigger set_updated_at_whatsapp_business_hours
  before update on public.whatsapp_business_hours
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- whatsapp_admin_notifications
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_admin_notifications (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  title text not null,
  body text,
  href text,
  conversation_id uuid references public.whatsapp_conversations (id) on delete set null,
  template_id uuid references public.whatsapp_templates (id) on delete set null,
  campaign_id uuid references public.broadcast_campaigns (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint whatsapp_admin_notifications_event_type_check check (
    event_type in (
      'inbound_message',
      'queue_new',
      'template_approved',
      'template_rejected',
      'campaign_completed'
    )
  )
);

comment on table public.whatsapp_admin_notifications is
  'Notificações WhatsApp para admins — lidas via whatsapp_notification_reads.';

create index if not exists idx_whatsapp_admin_notifications_created_at
  on public.whatsapp_admin_notifications using btree (created_at desc);

alter table public.whatsapp_admin_notifications enable row level security;

create policy "admin_select_whatsapp_admin_notifications" on public.whatsapp_admin_notifications
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "service_insert_whatsapp_admin_notifications" on public.whatsapp_admin_notifications
  for insert to service_role
  with check (true);

-- ---------------------------------------------------------------------------
-- whatsapp_notification_reads (multi-admin)
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_notification_reads (
  notification_id uuid not null references public.whatsapp_admin_notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

comment on table public.whatsapp_notification_reads is
  'Controle de leitura por admin — preparado para múltiplos logins.';

create index if not exists idx_whatsapp_notification_reads_user
  on public.whatsapp_notification_reads using btree (user_id, read_at desc);

alter table public.whatsapp_notification_reads enable row level security;

create policy "admin_select_own_notification_reads" on public.whatsapp_notification_reads
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "admin_insert_own_notification_reads" on public.whatsapp_notification_reads
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_admin((select auth.uid())))
  );

create policy "admin_update_own_notification_reads" on public.whatsapp_notification_reads
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- whatsapp_contact_deletion_audit (LGPD)
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_contact_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  name text,
  deleted_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz not null default now(),
  reason text,
  contact_snapshot jsonb not null default '{}'::jsonb
);

comment on table public.whatsapp_contact_deletion_audit is
  'Trilha de exclusão de contatos (hard delete) para comprovação LGPD.';

create index if not exists idx_whatsapp_contact_deletion_audit_deleted_at
  on public.whatsapp_contact_deletion_audit using btree (deleted_at desc);

alter table public.whatsapp_contact_deletion_audit enable row level security;

create policy "admin_select_whatsapp_contact_deletion_audit" on public.whatsapp_contact_deletion_audit
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_contact_deletion_audit" on public.whatsapp_contact_deletion_audit
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- trigger: atualizar conversa ao inserir mensagem
-- ---------------------------------------------------------------------------
create or replace function public.update_conversation_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.whatsapp_conversations
  set
    last_message_at = new.created_at,
    last_inbound_at = case
      when new.direction = 'inbound' then new.created_at
      else last_inbound_at
    end,
    last_outbound_at = case
      when new.direction = 'outbound' then new.created_at
      else last_outbound_at
    end,
    last_message_direction = new.direction,
    status = case
      when new.direction = 'inbound' then 'open'
      else status
    end,
    updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists whatsapp_messages_update_conversation_trigger on public.whatsapp_messages;
create trigger whatsapp_messages_update_conversation_trigger
  after insert on public.whatsapp_messages
  for each row execute function public.update_conversation_on_new_message();

-- ---------------------------------------------------------------------------
-- notificação + realtime ao receber inbound
-- ---------------------------------------------------------------------------
create or replace function public.notify_whatsapp_inbound_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.whatsapp_conversations%rowtype;
  v_title text;
  v_notification_id uuid;
begin
  if new.direction <> 'inbound' then
    return new;
  end if;

  select * into v_conversation
  from public.whatsapp_conversations
  where id = new.conversation_id;

  v_title := coalesce(v_conversation.contact_name, v_conversation.wa_id);

  insert into public.whatsapp_admin_notifications (
    event_type,
    title,
    body,
    href,
    conversation_id,
    payload
  )
  values (
    'inbound_message',
    v_title || ' enviou mensagem',
    left(coalesce(new.body_text, 'Nova mensagem'), 120),
    '/admin/conversas/' || new.conversation_id::text,
    new.conversation_id,
    jsonb_build_object(
      'message_id', new.id,
      'conversation_id', new.conversation_id,
      'wa_id', v_conversation.wa_id
    )
  )
  returning id into v_notification_id;

  perform realtime.send(
    'admin:whatsapp:notifications',
    'notification_created',
    jsonb_build_object(
      'id', v_notification_id,
      'event_type', 'inbound_message',
      'conversation_id', new.conversation_id
    ),
    true
  );

  return new;
end;
$$;

drop trigger if exists whatsapp_messages_inbound_notification_trigger on public.whatsapp_messages;
create trigger whatsapp_messages_inbound_notification_trigger
  after insert on public.whatsapp_messages
  for each row execute function public.notify_whatsapp_inbound_message();

-- ---------------------------------------------------------------------------
-- RPC: janela de 24h aberta?
-- ---------------------------------------------------------------------------
create or replace function public.is_whatsapp_service_window_open(p_conversation_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.whatsapp_conversations as c
    where c.id = p_conversation_id
      and c.deleted_at is null
      and c.last_inbound_at is not null
      and c.last_inbound_at > (now() - interval '24 hours')
  );
$$;

comment on function public.is_whatsapp_service_window_open(uuid) is
  'true se última inbound do cliente foi há menos de 24h (janela Meta).';

grant execute on function public.is_whatsapp_service_window_open(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: excluir contato com auditoria LGPD
-- ---------------------------------------------------------------------------
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
  if not (select public.is_admin((select auth.uid()))) then
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

grant execute on function public.delete_whatsapp_contact_with_audit(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: arquivar / excluir modelo
-- ---------------------------------------------------------------------------
create or replace function public.archive_whatsapp_template(p_template_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_admin((select auth.uid()))) then
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

grant execute on function public.archive_whatsapp_template(uuid) to authenticated;

create or replace function public.delete_whatsapp_template_draft(p_template_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.whatsapp_templates%rowtype;
begin
  if not (select public.is_admin((select auth.uid()))) then
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

grant execute on function public.delete_whatsapp_template_draft(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: marcar notificações lidas
-- ---------------------------------------------------------------------------
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

  if not (select public.is_admin(v_user_id)) then
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

grant execute on function public.mark_whatsapp_notifications_read(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- policy: admin insert outbound messages (via client após edge function — read only)
-- service role inserts via edge functions
-- ---------------------------------------------------------------------------
create policy "admin_insert_whatsapp_messages" on public.whatsapp_messages
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_conversations" on public.whatsapp_conversations
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));
