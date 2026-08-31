-- =============================================================================
-- Aplicar manualmente no Supabase Dashboard → SQL Editor
-- Projeto: pptgzavxpdltcuqpcovo
-- Consolida migrations:
--   20260831190000_whatsapp_contacts_landline.sql
--   20260831200000_fix_whatsapp_contacts_landline.sql
--   20260831210000_sync_whatsapp_contacts_landline.sql
--   20260831220000_fix_landline_strict_and_single_contact_broadcast.sql
-- =============================================================================

-- 1) Coluna is_landline + tag Telefone fixo
alter table public.whatsapp_contacts
  add column if not exists is_landline boolean not null default false;

comment on column public.whatsapp_contacts.is_landline is
  'Fixo BR: 55 + DDD (2) + 8 dígitos = 12 dígitos totais, sem 9 após o DDD.';

create index if not exists idx_whatsapp_contacts_is_landline
  on public.whatsapp_contacts using btree (is_landline)
  where is_landline = true;

insert into public.whatsapp_tags (name, slug, description, color, is_system)
values (
  'Telefone fixo',
  'telefone-fixo',
  'Contato sem WhatsApp — apenas consulta interna',
  '#64748b',
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  is_system = excluded.is_system;

-- 2) Corrige import com 9 indevido — REMOVIDO: reimporte a planilha (.xlsx).
--    A importação agora grava o TELEFONE exatamente como na planilha (só dígitos).

-- 3) Função + trigger: fixo = exatamente 12 dígitos, sem 9 após DDD
create or replace function public.phone_number_is_landline(p_phone text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with normalized as (
    select regexp_replace(p_phone, '\D', '', 'g') as digits
  )
  select
    digits like '55%'
    and length(digits) = 12
    and substring(digits from 5 for 1) <> '9'
  from normalized;
$$;

create or replace function public.sync_whatsapp_contact_is_landline()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.is_landline := public.phone_number_is_landline(new.phone_number);
  return new;
end;
$$;

drop trigger if exists sync_whatsapp_contact_is_landline_trigger on public.whatsapp_contacts;

create trigger sync_whatsapp_contact_is_landline_trigger
before insert or update of phone_number on public.whatsapp_contacts
for each row
execute function public.sync_whatsapp_contact_is_landline();

update public.whatsapp_contacts
set is_landline = public.phone_number_is_landline(phone_number);

-- 4) Mensagem ativa para um único contato
alter table public.broadcast_campaigns
  add column if not exists target_contact_id_draft uuid references public.whatsapp_contacts (id) on delete set null,
  add column if not exists target_contact_id uuid references public.whatsapp_contacts (id) on delete set null;

comment on column public.broadcast_campaigns.target_contact_id_draft is
  'Rascunho: enviar campanha só para este contato (alternativa à fila).';
comment on column public.broadcast_campaigns.target_contact_id is
  'Contato único publicado para disparo (alternativa à fila).';

create index if not exists idx_broadcast_campaigns_target_contact_id
  on public.broadcast_campaigns using btree (target_contact_id)
  where target_contact_id is not null;

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
    survey_flow_id = coalesce(survey_flow_id_draft, survey_flow_id),
    target_contact_id = coalesce(target_contact_id_draft, target_contact_id),
    published_at = now(),
    template_name_draft = null,
    template_params_draft = null,
    content_type_draft = null,
    queue_id_draft = null,
    survey_flow_id_draft = null,
    target_contact_id_draft = null,
    updated_at = now()
  where
    id = p_campaign_id
    and status = 'draft'
    and (
      template_name_draft is not null
      or template_params_draft is not null
      or content_type_draft is not null
      or queue_id_draft is not null
      or survey_flow_id_draft is not null
      or target_contact_id_draft is not null
    );

  if not found then
    raise exception 'campaign not found, not in draft, or nothing to publish';
  end if;
end;
$$;

-- 5) Registrar no histórico de migrations (para o CLI não tentar reaplicar)
insert into supabase_migrations.schema_migrations (version)
values
  ('20260831190000'),
  ('20260831200000'),
  ('20260831210000'),
  ('20260831220000')
on conflict (version) do nothing;
