-- migration: whatsapp tags, filas segmentadas, tipos de conteúdo e engajamento
-- purpose:
--   1) tags em contatos + filas definidas por combinação de tags (include/exclude)
--   2) campanhas com content_type além de pesquisa (promoção, informativo, etc.)
--   3) engajamento por contato (last_inbound_at) e tags automáticas de atividade
--   4) generaliza survey_responses → broadcast_responses
-- special considerations:
--   - additive; renomeia survey_responses apenas se existir
--   - filas resolvem contatos via resolve_queue_contact_ids(queue_id)

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create table public.whatsapp_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  color text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  constraint whatsapp_tags_slug_unique unique (slug)
);

comment on table public.whatsapp_tags is 'Etiquetas atribuíveis a contatos; filas são compostas por tags.';
comment on column public.whatsapp_tags.is_system is 'Tags automáticas (ex.: cliente-ativo) — só webhook/funções atribuem.';

create index idx_whatsapp_tags_slug on public.whatsapp_tags using btree (slug);

alter table public.whatsapp_tags enable row level security;

create policy "admin_select_whatsapp_tags" on public.whatsapp_tags
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_tags" on public.whatsapp_tags
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_tags" on public.whatsapp_tags
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_whatsapp_tags" on public.whatsapp_tags
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- contact ↔ tag (m:n)
-- ---------------------------------------------------------------------------
create table public.whatsapp_contact_tags (
  contact_id uuid not null references public.whatsapp_contacts (id) on delete cascade,
  tag_id uuid not null references public.whatsapp_tags (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by text not null default 'admin',
  primary key (contact_id, tag_id),
  constraint whatsapp_contact_tags_assigned_by_check check (assigned_by in ('admin', 'system', 'import'))
);

comment on table public.whatsapp_contact_tags is 'Tags atribuídas a cada contato; base para filas segmentadas.';

create index idx_whatsapp_contact_tags_tag_id on public.whatsapp_contact_tags using btree (tag_id);
create index idx_whatsapp_contact_tags_contact_id on public.whatsapp_contact_tags using btree (contact_id);

alter table public.whatsapp_contact_tags enable row level security;

create policy "admin_select_whatsapp_contact_tags" on public.whatsapp_contact_tags
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_contact_tags" on public.whatsapp_contact_tags
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_contact_tags" on public.whatsapp_contact_tags
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_whatsapp_contact_tags" on public.whatsapp_contact_tags
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- filas (segmentos) definidas por tags
-- ---------------------------------------------------------------------------
create table public.whatsapp_queues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  include_match text not null default 'any',
  exclude_match text not null default 'any',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_queues_slug_unique unique (slug),
  constraint whatsapp_queues_include_match_check check (include_match in ('any', 'all')),
  constraint whatsapp_queues_exclude_match_check check (exclude_match in ('any', 'all'))
);

comment on table public.whatsapp_queues is 'Filas segmentadas; membership calculada pelas tags include/exclude.';
comment on column public.whatsapp_queues.include_match is 'any = pelo menos uma tag include; all = todas as tags include.';
comment on column public.whatsapp_queues.exclude_match is 'any = exclui se tiver qualquer tag exclude.';

create index idx_whatsapp_queues_slug on public.whatsapp_queues using btree (slug);
create index idx_whatsapp_queues_is_active on public.whatsapp_queues using btree (is_active);

alter table public.whatsapp_queues enable row level security;

create policy "admin_select_whatsapp_queues" on public.whatsapp_queues
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_queues" on public.whatsapp_queues
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_queues" on public.whatsapp_queues
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_whatsapp_queues" on public.whatsapp_queues
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

create trigger set_updated_at_whatsapp_queues
  before update on public.whatsapp_queues
  for each row execute function public.set_updated_at();

-- tags que compõem cada fila (include ou exclude)
create table public.whatsapp_queue_tags (
  queue_id uuid not null references public.whatsapp_queues (id) on delete cascade,
  tag_id uuid not null references public.whatsapp_tags (id) on delete cascade,
  rule_type text not null,
  primary key (queue_id, tag_id, rule_type),
  constraint whatsapp_queue_tags_rule_type_check check (rule_type in ('include', 'exclude'))
);

comment on table public.whatsapp_queue_tags is 'Tags que definem quem entra ou sai de cada fila.';

create index idx_whatsapp_queue_tags_queue_id on public.whatsapp_queue_tags using btree (queue_id);
create index idx_whatsapp_queue_tags_tag_id on public.whatsapp_queue_tags using btree (tag_id);

alter table public.whatsapp_queue_tags enable row level security;

create policy "admin_select_whatsapp_queue_tags" on public.whatsapp_queue_tags
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_queue_tags" on public.whatsapp_queue_tags
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_queue_tags" on public.whatsapp_queue_tags
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_whatsapp_queue_tags" on public.whatsapp_queue_tags
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- engajamento em contatos
-- ---------------------------------------------------------------------------
alter table public.whatsapp_contacts
  add column if not exists last_inbound_at timestamptz,
  add column if not exists last_outbound_at timestamptz,
  add column if not exists engagement_level text not null default 'unknown',
  add column if not exists inbound_count integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.whatsapp_contacts
  drop constraint if exists whatsapp_contacts_engagement_level_check;

alter table public.whatsapp_contacts
  add constraint whatsapp_contacts_engagement_level_check check (
    engagement_level in ('active', 'warm', 'cold', 'unknown')
  );

comment on column public.whatsapp_contacts.engagement_level is
  'active = interação recente; warm = moderado; cold = sem resposta há muito; unknown = sem histórico.';
comment on column public.whatsapp_contacts.last_inbound_at is 'Última mensagem recebida do cliente (webhook).';
comment on column public.whatsapp_contacts.last_outbound_at is 'Último disparo enviado ao cliente.';

create index idx_whatsapp_contacts_engagement_level on public.whatsapp_contacts using btree (engagement_level);
create index idx_whatsapp_contacts_last_inbound_at on public.whatsapp_contacts using btree (last_inbound_at desc nulls last);

-- ---------------------------------------------------------------------------
-- campanhas: tipo de conteúdo + fila alvo (draft + publicado)
-- ---------------------------------------------------------------------------
alter table public.broadcast_campaigns
  add column if not exists content_type text,
  add column if not exists content_type_draft text,
  add column if not exists queue_id uuid references public.whatsapp_queues (id) on delete set null,
  add column if not exists queue_id_draft uuid references public.whatsapp_queues (id) on delete set null;

alter table public.broadcast_campaigns
  drop constraint if exists broadcast_campaigns_content_type_check;

alter table public.broadcast_campaigns
  add constraint broadcast_campaigns_content_type_check check (
    content_type is null
    or content_type in ('survey', 'promotion', 'informational', 'utility', 'reminder')
  );

alter table public.broadcast_campaigns
  drop constraint if exists broadcast_campaigns_content_type_draft_check;

alter table public.broadcast_campaigns
  add constraint broadcast_campaigns_content_type_draft_check check (
    content_type_draft is null
    or content_type_draft in ('survey', 'promotion', 'informational', 'utility', 'reminder')
  );

comment on column public.broadcast_campaigns.content_type is
  'Tipo publicado: survey, promotion, informational, utility, reminder.';
comment on column public.broadcast_campaigns.content_type_draft is 'Rascunho do tipo até publicar.';
comment on column public.broadcast_campaigns.queue_id is 'Fila publicada — motor envia só para contatos desta fila.';
comment on column public.broadcast_campaigns.queue_id_draft is 'Rascunho da fila alvo até publicar.';

create index idx_broadcast_campaigns_queue_id on public.broadcast_campaigns using btree (queue_id);
create index idx_broadcast_campaigns_content_type on public.broadcast_campaigns using btree (content_type);

-- ---------------------------------------------------------------------------
-- generalizar respostas: survey_responses → broadcast_responses
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'survey_responses'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'broadcast_responses'
  ) then
    alter table public.survey_responses rename to broadcast_responses;
  end if;
end;
$$;

create table if not exists public.broadcast_responses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.broadcast_campaigns (id) on delete cascade,
  contact_id uuid not null references public.whatsapp_contacts (id) on delete restrict,
  response_value text not null,
  response_type text not null default 'survey',
  received_at timestamptz not null default now(),
  meta_message_id text,
  constraint broadcast_responses_meta_message_id_unique unique (meta_message_id),
  constraint broadcast_responses_response_type_check check (
    response_type in ('survey', 'reply', 'button', 'reaction', 'other')
  )
);

comment on table public.broadcast_responses is
  'Interações inbound de campanhas: pesquisas, respostas, botões e outros tipos.';

alter table public.broadcast_responses
  add column if not exists response_type text not null default 'survey';

alter table public.broadcast_responses enable row level security;

-- policies (idempotente: drop se existirem nomes antigos)
drop policy if exists "admin_select_survey_responses" on public.broadcast_responses;
drop policy if exists "admin_insert_survey_responses" on public.broadcast_responses;
drop policy if exists "admin_update_survey_responses" on public.broadcast_responses;
drop policy if exists "admin_delete_survey_responses" on public.broadcast_responses;

drop policy if exists "admin_select_broadcast_responses" on public.broadcast_responses;
create policy "admin_select_broadcast_responses" on public.broadcast_responses
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

drop policy if exists "admin_insert_broadcast_responses" on public.broadcast_responses;
create policy "admin_insert_broadcast_responses" on public.broadcast_responses
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

drop policy if exists "admin_update_broadcast_responses" on public.broadcast_responses;
create policy "admin_update_broadcast_responses" on public.broadcast_responses
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

drop policy if exists "admin_delete_broadcast_responses" on public.broadcast_responses;
create policy "admin_delete_broadcast_responses" on public.broadcast_responses
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

create index if not exists idx_broadcast_responses_campaign_id on public.broadcast_responses using btree (campaign_id);
create index if not exists idx_broadcast_responses_contact_id on public.broadcast_responses using btree (contact_id);
create index if not exists idx_broadcast_responses_received_at on public.broadcast_responses using btree (received_at desc);
create index if not exists idx_broadcast_responses_response_type on public.broadcast_responses using btree (response_type);

-- trigger realtime (substitui survey_responses)
drop trigger if exists survey_responses_broadcast_trigger on public.broadcast_responses;

create or replace function public.notify_broadcast_response_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    'admin:whatsapp:broadcasts',
    'broadcast_response_received',
    jsonb_build_object(
      'id', new.id,
      'campaign_id', new.campaign_id,
      'contact_id', new.contact_id,
      'response_value', new.response_value,
      'response_type', new.response_type,
      'received_at', new.received_at
    ),
    false
  );
  return new;
end;
$$;

drop trigger if exists broadcast_responses_broadcast_trigger on public.broadcast_responses;
create trigger broadcast_responses_broadcast_trigger
  after insert on public.broadcast_responses
  for each row execute function public.notify_broadcast_response_created();

-- ---------------------------------------------------------------------------
-- publish: inclui content_type e queue_id
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

-- ---------------------------------------------------------------------------
-- resolve contatos de uma fila (tags include/exclude + status active)
-- ---------------------------------------------------------------------------
create or replace function public.resolve_queue_contact_ids(p_queue_id uuid)
returns setof uuid
language sql
stable
security invoker
set search_path = ''
as $$
  with queue_rules as (
    select
      q.id,
      q.include_match,
      q.exclude_match,
      coalesce(
        (
          select array_agg(qt.tag_id)
          from public.whatsapp_queue_tags as qt
          where qt.queue_id = q.id and qt.rule_type = 'include'
        ),
        array[]::uuid[]
      ) as include_tag_ids,
      coalesce(
        (
          select array_agg(qt.tag_id)
          from public.whatsapp_queue_tags as qt
          where qt.queue_id = q.id and qt.rule_type = 'exclude'
        ),
        array[]::uuid[]
      ) as exclude_tag_ids
    from public.whatsapp_queues as q
    where q.id = p_queue_id and q.is_active = true
  ),
  contact_tags as (
    select
      c.id as contact_id,
      coalesce(array_agg(ct.tag_id) filter (where ct.tag_id is not null), array[]::uuid[]) as tag_ids
    from public.whatsapp_contacts as c
    left join public.whatsapp_contact_tags as ct on ct.contact_id = c.id
    where c.status = 'active'
    group by c.id
  )
  select ct.contact_id
  from contact_tags as ct
  cross join queue_rules as qr
  where
    qr.id is not null
    and (
      cardinality(qr.include_tag_ids) = 0
      or (
        qr.include_match = 'any'
        and ct.tag_ids && qr.include_tag_ids
      )
      or (
        qr.include_match = 'all'
        and qr.include_tag_ids <@ ct.tag_ids
      )
    )
    and (
      cardinality(qr.exclude_tag_ids) = 0
      or not (
        qr.exclude_match = 'any'
        and ct.tag_ids && qr.exclude_tag_ids
      )
    );
$$;

comment on function public.resolve_queue_contact_ids(uuid) is
  'Retorna IDs de contatos active que pertencem à fila conforme tags include/exclude.';

grant execute on function public.resolve_queue_contact_ids(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- engajamento + tags automáticas (cliente-ativo / cliente-inativo)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_contact_engagement(p_contact_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last_inbound timestamptz;
  v_inbound_count integer;
  v_level text;
  v_tag_active uuid;
  v_tag_inactive uuid;
begin
  select last_inbound_at, inbound_count
  into v_last_inbound, v_inbound_count
  from public.whatsapp_contacts
  where id = p_contact_id;

  if v_inbound_count = 0 or v_last_inbound is null then
    v_level := 'unknown';
  elsif v_last_inbound >= now() - interval '30 days' then
    v_level := 'active';
  elsif v_last_inbound >= now() - interval '90 days' then
    v_level := 'warm';
  else
    v_level := 'cold';
  end if;

  update public.whatsapp_contacts
  set engagement_level = v_level, updated_at = now()
  where id = p_contact_id;

  select id into v_tag_active from public.whatsapp_tags where slug = 'cliente-ativo' limit 1;
  select id into v_tag_inactive from public.whatsapp_tags where slug = 'cliente-inativo' limit 1;

  if v_tag_active is not null then
    if v_level in ('active', 'warm') then
      insert into public.whatsapp_contact_tags (contact_id, tag_id, assigned_by)
      values (p_contact_id, v_tag_active, 'system')
      on conflict (contact_id, tag_id) do nothing;
      if v_tag_inactive is not null then
        delete from public.whatsapp_contact_tags
        where contact_id = p_contact_id and tag_id = v_tag_inactive;
      end if;
    elsif v_level = 'cold' and v_tag_inactive is not null then
      insert into public.whatsapp_contact_tags (contact_id, tag_id, assigned_by)
      values (p_contact_id, v_tag_inactive, 'system')
      on conflict (contact_id, tag_id) do nothing;
      delete from public.whatsapp_contact_tags
      where contact_id = p_contact_id and tag_id = v_tag_active;
    end if;
  end if;
end;
$$;

comment on function public.refresh_contact_engagement(uuid) is
  'Recalcula engagement_level e tags sistema cliente-ativo/cliente-inativo.';

-- ---------------------------------------------------------------------------
-- seeds: tags e filas padrão
-- ---------------------------------------------------------------------------
insert into public.whatsapp_tags (name, slug, description, color, is_system)
values
  ('Cliente ativo', 'cliente-ativo', 'Respondeu ou interagiu nos últimos 90 dias', '#22c55e', true),
  ('Cliente inativo', 'cliente-inativo', 'Sem interação inbound há mais de 90 dias', '#94a3b8', true),
  ('Nunca respondeu', 'nunca-respondeu', 'Recebeu disparo mas nunca respondeu', '#f59e0b', true),
  ('VIP', 'vip', 'Cliente prioritário (atribuição manual)', '#a855f7', false),
  ('Promoção', 'promocao', 'Elegível para campanhas promocionais', '#ef4444', false)
on conflict (slug) do nothing;

insert into public.whatsapp_queues (name, slug, description, include_match, exclude_match)
values
  (
    'Clientes ativos',
    'clientes-ativos',
    'Contatos com tag cliente-ativo',
    'any',
    'any'
  ),
  (
    'Clientes inativos',
    'clientes-inativos',
    'Contatos com tag cliente-inativo',
    'any',
    'any'
  ),
  (
    'Nunca responderam',
    'nunca-responderam',
    'Contatos que nunca interagiram inbound',
    'any',
    'any'
  )
on conflict (slug) do nothing;

insert into public.whatsapp_queue_tags (queue_id, tag_id, rule_type)
select q.id, t.id, 'include'
from public.whatsapp_queues as q
join public.whatsapp_tags as t on t.slug = 'cliente-ativo'
where q.slug = 'clientes-ativos'
on conflict do nothing;

insert into public.whatsapp_queue_tags (queue_id, tag_id, rule_type)
select q.id, t.id, 'include'
from public.whatsapp_queues as q
join public.whatsapp_tags as t on t.slug = 'cliente-inativo'
where q.slug = 'clientes-inativos'
on conflict do nothing;

insert into public.whatsapp_queue_tags (queue_id, tag_id, rule_type)
select q.id, t.id, 'include'
from public.whatsapp_queues as q
join public.whatsapp_tags as t on t.slug = 'nunca-respondeu'
where q.slug = 'nunca-responderam'
on conflict do nothing;

-- fila clientes-ativos exclui inativos e opted_out implícito via status active em resolve
insert into public.whatsapp_queue_tags (queue_id, tag_id, rule_type)
select q.id, t.id, 'exclude'
from public.whatsapp_queues as q
join public.whatsapp_tags as t on t.slug = 'cliente-inativo'
where q.slug = 'clientes-ativos'
on conflict do nothing;
