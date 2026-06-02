-- migration: whatsapp crm infrastructure (base para inbox/conversas)
-- purpose:
--   1) whatsapp_config — conta/número Meta conectado
--   2) whatsapp_conversations — threads por wa_id (cliente)
--   3) whatsapp_messages — mensagens individuais com deduplicação meta_message_id
--   4) whatsapp_webhook_events — auditoria bruta de payloads Meta
-- special considerations:
--   - additive; complementa whatsapp_contacts (disparos) sem substituir
--   - soft-delete via deleted_at (sem delete físico em conversas/mensagens)
--   - edge functions escrevem via service role; admin lê via rls is_admin()

-- ---------------------------------------------------------------------------
-- whatsapp_config
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_config (
  id bigint generated always as identity primary key,
  phone_number_id text not null,
  display_name text,
  status text not null default 'active',
  webhook_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_config_phone_number_id_unique unique (phone_number_id),
  constraint whatsapp_config_status_check check (status in ('active', 'inactive'))
);

comment on table public.whatsapp_config is 'Configuração da conta WhatsApp Business conectada (Meta Cloud API).';

alter table public.whatsapp_config enable row level security;

create policy "admin_select_whatsapp_config" on public.whatsapp_config
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_config" on public.whatsapp_config
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_config" on public.whatsapp_config
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- whatsapp_conversations
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null,
  contact_name text,
  status text not null default 'open',
  last_message_at timestamptz,
  whatsapp_contact_id uuid references public.whatsapp_contacts (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_conversations_wa_id_unique unique (wa_id),
  constraint whatsapp_conversations_status_check check (status in ('open', 'closed', 'pending'))
);

comment on table public.whatsapp_conversations is 'Thread de conversa CRM por wa_id do cliente (E.164 sem +).';
comment on column public.whatsapp_conversations.wa_id is 'WhatsApp ID do cliente (ex.: 5511999999999).';
comment on column public.whatsapp_conversations.deleted_at is 'Soft-delete — nunca apagar conversas fisicamente.';

create index if not exists idx_whatsapp_conversations_last_message_at
  on public.whatsapp_conversations using btree (last_message_at desc nulls last);

create index if not exists idx_whatsapp_conversations_status
  on public.whatsapp_conversations using btree (status)
  where deleted_at is null;

create index if not exists idx_whatsapp_conversations_whatsapp_contact_id
  on public.whatsapp_conversations using btree (whatsapp_contact_id);

alter table public.whatsapp_conversations enable row level security;

create policy "admin_select_whatsapp_conversations" on public.whatsapp_conversations
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_conversations" on public.whatsapp_conversations
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- whatsapp_messages
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations (id) on delete restrict,
  meta_message_id text,
  direction text not null,
  message_type text not null default 'text',
  content jsonb not null default '{}'::jsonb,
  body_text text,
  status text not null default 'received',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint whatsapp_messages_meta_message_id_unique unique (meta_message_id),
  constraint whatsapp_messages_direction_check check (direction in ('inbound', 'outbound')),
  constraint whatsapp_messages_status_check check (
    status in ('received', 'sent', 'delivered', 'read', 'failed')
  )
);

comment on table public.whatsapp_messages is 'Mensagens CRM (inbound/outbound) com payload Meta em content.';
comment on column public.whatsapp_messages.meta_message_id is 'ID Meta — deduplicação/idempotência de webhooks.';

create index if not exists idx_whatsapp_messages_conversation_id
  on public.whatsapp_messages using btree (conversation_id, created_at desc);

create index if not exists idx_whatsapp_messages_status
  on public.whatsapp_messages using btree (status);

alter table public.whatsapp_messages enable row level security;

create policy "admin_select_whatsapp_messages" on public.whatsapp_messages
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_messages" on public.whatsapp_messages
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- whatsapp_webhook_events (auditoria)
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  phone_number_id text,
  raw_payload jsonb not null,
  processed boolean not null default false,
  processing_error text,
  created_at timestamptz not null default now()
);

comment on table public.whatsapp_webhook_events is 'Log bruto de eventos Meta recebidos no webhook (auditoria).';

create index if not exists idx_whatsapp_webhook_events_created_at
  on public.whatsapp_webhook_events using btree (created_at desc);

create index if not exists idx_whatsapp_webhook_events_processed
  on public.whatsapp_webhook_events using btree (processed, created_at desc);

alter table public.whatsapp_webhook_events enable row level security;

create policy "admin_select_whatsapp_webhook_events" on public.whatsapp_webhook_events
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- triggers updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists set_updated_at_whatsapp_config on public.whatsapp_config;
create trigger set_updated_at_whatsapp_config
  before update on public.whatsapp_config
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_whatsapp_conversations on public.whatsapp_conversations;
create trigger set_updated_at_whatsapp_conversations
  before update on public.whatsapp_conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- realtime: nova mensagem CRM → admin:whatsapp:crm
-- ---------------------------------------------------------------------------
create or replace function public.notify_whatsapp_crm_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    'admin:whatsapp:crm',
    'message_created',
    jsonb_build_object(
      'id', new.id,
      'conversation_id', new.conversation_id,
      'direction', new.direction,
      'message_type', new.message_type,
      'body_text', new.body_text,
      'status', new.status,
      'created_at', new.created_at
    ),
    true
  );
  return new;
end;
$$;

drop trigger if exists whatsapp_messages_crm_broadcast_trigger on public.whatsapp_messages;
create trigger whatsapp_messages_crm_broadcast_trigger
  after insert on public.whatsapp_messages
  for each row execute function public.notify_whatsapp_crm_message();

-- ---------------------------------------------------------------------------
-- upsert config ativa (chamado pelo webhook via service role)
-- ---------------------------------------------------------------------------
create or replace function public.upsert_whatsapp_config_active(
  p_phone_number_id text,
  p_display_name text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.whatsapp_config (phone_number_id, display_name, status, webhook_verified_at)
  values (p_phone_number_id, p_display_name, 'active', now())
  on conflict (phone_number_id) do update
  set
    display_name = coalesce(excluded.display_name, public.whatsapp_config.display_name),
    status = 'active',
    webhook_verified_at = coalesce(public.whatsapp_config.webhook_verified_at, now()),
    updated_at = now();
end;
$$;

comment on function public.upsert_whatsapp_config_active(text, text) is
  'Marca número Meta como ativo quando webhook recebe eventos (service role).';

grant execute on function public.upsert_whatsapp_config_active(text, text) to service_role;
