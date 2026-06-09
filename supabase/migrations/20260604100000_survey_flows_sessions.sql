-- migration: pesquisas sequenciais no WhatsApp (fluxo multi-pergunta no chat)
-- purpose: sessões por contato, respostas por etapa, sem link externo
-- affected: survey_flows, survey_sessions, survey_session_answers, broadcast_campaigns

create table if not exists public.survey_flows (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  intro_message text not null,
  steps jsonb not null default '[]'::jsonb,
  suggested_queue_slug text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survey_flows_slug_unique unique (slug)
);

comment on table public.survey_flows is
  'Definição de pesquisas sequenciais respondidas no próprio WhatsApp (botões/lista/texto).';

comment on column public.survey_flows.steps is
  'Array JSON: [{id, question, kind: choice|text, options?: [{id, label}]}].';

create index if not exists idx_survey_flows_slug on public.survey_flows using btree (slug);
create index if not exists idx_survey_flows_is_active on public.survey_flows using btree (is_active);

alter table public.survey_flows enable row level security;

create policy "admin_select_survey_flows" on public.survey_flows
  for select to authenticated
  using ((select private.is_admin((select auth.uid()))));

create policy "admin_insert_survey_flows" on public.survey_flows
  for insert to authenticated
  with check ((select private.is_admin((select auth.uid()))));

create policy "admin_update_survey_flows" on public.survey_flows
  for update to authenticated
  using ((select private.is_admin((select auth.uid()))))
  with check ((select private.is_admin((select auth.uid()))));

create policy "admin_delete_survey_flows" on public.survey_flows
  for delete to authenticated
  using ((select private.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------

create table if not exists public.survey_sessions (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.survey_flows (id) on delete restrict,
  campaign_id uuid references public.broadcast_campaigns (id) on delete set null,
  contact_id uuid not null references public.whatsapp_contacts (id) on delete cascade,
  current_step_index int not null default 0,
  status text not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint survey_sessions_status_check check (
    status in ('in_progress', 'completed', 'abandoned')
  )
);

comment on table public.survey_sessions is
  'Sessão ativa de pesquisa por contato; avança pergunta a pergunta no chat.';

create index if not exists idx_survey_sessions_contact_status
  on public.survey_sessions using btree (contact_id, status);

create index if not exists idx_survey_sessions_campaign_id
  on public.survey_sessions using btree (campaign_id);

create unique index if not exists idx_survey_sessions_active_contact
  on public.survey_sessions using btree (contact_id)
  where status = 'in_progress';

alter table public.survey_sessions enable row level security;

create policy "admin_select_survey_sessions" on public.survey_sessions
  for select to authenticated
  using ((select private.is_admin((select auth.uid()))));

create policy "admin_insert_survey_sessions" on public.survey_sessions
  for insert to authenticated
  with check ((select private.is_admin((select auth.uid()))));

create policy "admin_update_survey_sessions" on public.survey_sessions
  for update to authenticated
  using ((select private.is_admin((select auth.uid()))))
  with check ((select private.is_admin((select auth.uid()))));

create policy "admin_delete_survey_sessions" on public.survey_sessions
  for delete to authenticated
  using ((select private.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------

create table if not exists public.survey_session_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.survey_sessions (id) on delete cascade,
  step_index int not null,
  step_id text not null,
  response_value text not null,
  response_label text,
  response_type text not null default 'choice',
  meta_message_id text,
  received_at timestamptz not null default now(),
  constraint survey_session_answers_session_step_unique unique (session_id, step_index),
  constraint survey_session_answers_meta_message_id_unique unique (meta_message_id),
  constraint survey_session_answers_response_type_check check (
    response_type in ('choice', 'text', 'button', 'list')
  )
);

comment on table public.survey_session_answers is
  'Respostas por etapa de uma pesquisa sequencial.';

create index if not exists idx_survey_session_answers_session_id
  on public.survey_session_answers using btree (session_id);

alter table public.survey_session_answers enable row level security;

create policy "admin_select_survey_session_answers" on public.survey_session_answers
  for select to authenticated
  using ((select private.is_admin((select auth.uid()))));

create policy "admin_insert_survey_session_answers" on public.survey_session_answers
  for insert to authenticated
  with check ((select private.is_admin((select auth.uid()))));

create policy "admin_update_survey_session_answers" on public.survey_session_answers
  for update to authenticated
  using ((select private.is_admin((select auth.uid()))))
  with check ((select private.is_admin((select auth.uid()))));

create policy "admin_delete_survey_session_answers" on public.survey_session_answers
  for delete to authenticated
  using ((select private.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------

alter table public.broadcast_campaigns
  add column if not exists survey_flow_id uuid references public.survey_flows (id) on delete set null;

comment on column public.broadcast_campaigns.survey_flow_id is
  'Quando preenchido, dispara pesquisa sequencial no chat após o template inicial.';

create index if not exists idx_broadcast_campaigns_survey_flow_id
  on public.broadcast_campaigns using btree (survey_flow_id)
  where survey_flow_id is not null;
