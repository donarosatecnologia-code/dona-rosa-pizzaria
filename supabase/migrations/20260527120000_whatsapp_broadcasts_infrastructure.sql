-- migration: whatsapp broadcasts infrastructure (disparos ativos)
-- purpose:
--   1) contacts, campaigns with draft/publish, survey responses, send recipients
--   2) rls admin-only via public.is_admin()
--   3) publish rpc for campaigns (draft → published columns)
--   4) realtime broadcast trigger for new survey responses
-- affected tables: whatsapp_contacts, broadcast_campaigns, broadcast_campaign_recipients,
--   survey_responses
-- special considerations:
--   - additive only; supports up to ~2.000 contacts with indexed lookups
--   - motor de envio must read only published columns (never *_draft)

-- ---------------------------------------------------------------------------
-- whatsapp_contacts
-- ---------------------------------------------------------------------------
create table public.whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint whatsapp_contacts_phone_number_unique unique (phone_number),
  constraint whatsapp_contacts_status_check check (status in ('active', 'opted_out'))
);

comment on table public.whatsapp_contacts is 'Contatos elegíveis para disparos ativos WhatsApp (até ~2.000).';
comment on column public.whatsapp_contacts.phone_number is 'Número E.164 sem espaços (ex.: 5511999999999).';
comment on column public.whatsapp_contacts.status is 'active = pode receber; opted_out = opt-out LGPD/Meta.';

create index idx_whatsapp_contacts_status on public.whatsapp_contacts using btree (status);
create index idx_whatsapp_contacts_created_at on public.whatsapp_contacts using btree (created_at desc);

alter table public.whatsapp_contacts enable row level security;

create policy "admin_select_whatsapp_contacts" on public.whatsapp_contacts
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_contacts" on public.whatsapp_contacts
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_contacts" on public.whatsapp_contacts
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_whatsapp_contacts" on public.whatsapp_contacts
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- broadcast_campaigns (draft columns + published columns)
-- ---------------------------------------------------------------------------
create table public.broadcast_campaigns (
  id uuid primary key default gen_random_uuid(),
  template_name text,
  template_name_draft text,
  template_params jsonb,
  template_params_draft jsonb,
  status text not null default 'draft',
  total_sent integer not null default 0,
  total_delivered integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint broadcast_campaigns_status_check check (status in ('draft', 'sending', 'completed')),
  constraint broadcast_campaigns_total_sent_nonneg check (total_sent >= 0),
  constraint broadcast_campaigns_total_delivered_nonneg check (total_delivered >= 0)
);

comment on table public.broadcast_campaigns is 'Campanhas de disparo ativo; rascunho em *_draft; motor lê colunas publicadas após publish.';
comment on column public.broadcast_campaigns.template_name is 'Nome do template Meta aprovado (publicado).';
comment on column public.broadcast_campaigns.template_name_draft is 'Rascunho do template até publicar.';
comment on column public.broadcast_campaigns.template_params is 'Parâmetros do template publicados (json).';
comment on column public.broadcast_campaigns.template_params_draft is 'Parâmetros rascunho até publicar.';
comment on column public.broadcast_campaigns.published_at is 'Momento em que rascunho foi consolidado para envio.';

create index idx_broadcast_campaigns_status on public.broadcast_campaigns using btree (status);
create index idx_broadcast_campaigns_published_at on public.broadcast_campaigns using btree (published_at desc nulls last);
create index idx_broadcast_campaigns_created_at on public.broadcast_campaigns using btree (created_at desc);

alter table public.broadcast_campaigns enable row level security;

create policy "admin_select_broadcast_campaigns" on public.broadcast_campaigns
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_broadcast_campaigns" on public.broadcast_campaigns
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_broadcast_campaigns" on public.broadcast_campaigns
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_broadcast_campaigns" on public.broadcast_campaigns
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

create trigger set_updated_at_broadcast_campaigns
  before update on public.broadcast_campaigns
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- broadcast_campaign_recipients (tracking de envio por contato)
-- ---------------------------------------------------------------------------
create table public.broadcast_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.broadcast_campaigns (id) on delete cascade,
  contact_id uuid not null references public.whatsapp_contacts (id) on delete restrict,
  meta_message_id text,
  send_status text not null default 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  constraint broadcast_campaign_recipients_campaign_contact_unique unique (campaign_id, contact_id),
  constraint broadcast_campaign_recipients_meta_message_id_unique unique (meta_message_id),
  constraint broadcast_campaign_recipients_send_status_check check (
    send_status in ('pending', 'sent', 'delivered', 'failed', 'read')
  )
);

comment on table public.broadcast_campaign_recipients is 'Destinatários por campanha; atualizado pelo motor de envio e webhooks Meta.';

create index idx_broadcast_recipients_campaign_id on public.broadcast_campaign_recipients using btree (campaign_id);
create index idx_broadcast_recipients_contact_id on public.broadcast_campaign_recipients using btree (contact_id);
create index idx_broadcast_recipients_send_status on public.broadcast_campaign_recipients using btree (send_status);
create index idx_broadcast_recipients_meta_message_id on public.broadcast_campaign_recipients using btree (meta_message_id)
  where meta_message_id is not null;

alter table public.broadcast_campaign_recipients enable row level security;

create policy "admin_select_broadcast_campaign_recipients" on public.broadcast_campaign_recipients
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_broadcast_campaign_recipients" on public.broadcast_campaign_recipients
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_broadcast_campaign_recipients" on public.broadcast_campaign_recipients
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_broadcast_campaign_recipients" on public.broadcast_campaign_recipients
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- survey_responses (respostas recebidas via webhook Meta)
-- ---------------------------------------------------------------------------
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.broadcast_campaigns (id) on delete cascade,
  contact_id uuid not null references public.whatsapp_contacts (id) on delete restrict,
  response_value text not null,
  received_at timestamptz not null default now(),
  meta_message_id text,
  constraint survey_responses_meta_message_id_unique unique (meta_message_id)
);

comment on table public.survey_responses is 'Respostas de pesquisa/disparo recebidas dos clientes via webhook Meta.';

create index idx_survey_responses_campaign_id on public.survey_responses using btree (campaign_id);
create index idx_survey_responses_contact_id on public.survey_responses using btree (contact_id);
create index idx_survey_responses_received_at on public.survey_responses using btree (received_at desc);

alter table public.survey_responses enable row level security;

create policy "admin_select_survey_responses" on public.survey_responses
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_survey_responses" on public.survey_responses
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_survey_responses" on public.survey_responses
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_survey_responses" on public.survey_responses
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- publish: consolida rascunho da campanha (admin only)
-- ---------------------------------------------------------------------------
create or replace function public.publish_broadcast_campaign(p_campaign_id uuid)
returns void
language plpgsql
security definer
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

comment on function public.publish_broadcast_campaign(uuid) is
  'Copia template_name_draft/template_params_draft para colunas publicadas. Motor de envio lê apenas publicadas.';

grant execute on function public.publish_broadcast_campaign(uuid) to authenticated;

-- incremento atômico de entregues (chamado pelo webhook via service role)
create or replace function public.increment_broadcast_campaign_delivered(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.broadcast_campaigns
  set
    total_delivered = total_delivered + 1,
    updated_at = now()
  where id = p_campaign_id;
end;
$$;

comment on function public.increment_broadcast_campaign_delivered(uuid) is
  'Incrementa total_delivered da campanha quando Meta confirma entrega (webhook).';

-- ---------------------------------------------------------------------------
-- realtime: notifica admin quando chega resposta de pesquisa
-- ---------------------------------------------------------------------------
create or replace function public.notify_survey_response_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    'admin:whatsapp:broadcasts',
    'survey_response_received',
    jsonb_build_object(
      'id', new.id,
      'campaign_id', new.campaign_id,
      'contact_id', new.contact_id,
      'response_value', new.response_value,
      'received_at', new.received_at
    ),
    false
  );
  return new;
end;
$$;

create trigger survey_responses_broadcast_trigger
  after insert on public.survey_responses
  for each row execute function public.notify_survey_response_created();

-- canal privado: apenas admin autenticado
create policy "admin_receive_whatsapp_broadcast_realtime" on realtime.messages
  for select to authenticated
  using (
    topic = 'admin:whatsapp:broadcasts'
    and (select public.is_admin((select auth.uid())))
  );

create policy "admin_write_whatsapp_broadcast_realtime" on realtime.messages
  for insert to authenticated
  with check (
    topic = 'admin:whatsapp:broadcasts'
    and (select public.is_admin((select auth.uid())))
  );
