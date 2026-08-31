-- migration: fixo estrito (12 dígitos) + corrige import com 9 indevido + disparo para um contato
-- purpose: telefone fixo = 55+DDD+8 dígitos; unmangle import; campanha com target_contact_id

-- ---------------------------------------------------------------------------
-- 1) Corrige phones importados com 9 inserido (5511938621077 → 551138621077)
-- ---------------------------------------------------------------------------
update public.whatsapp_contacts as wc
set phone_number = fixed.digits
from (
  select
    id,
    substring(digits from 1 for 4) || substring(digits from 6) as digits
  from (
    select
      id,
      regexp_replace(phone_number, '\D', '', 'g') as digits
    from public.whatsapp_contacts
    where import_batch_id is not null
  ) as raw
  where length(raw.digits) = 13
    and substring(raw.digits from 5 for 1) = '9'
    and length(substring(raw.digits from 1 for 4) || substring(raw.digits from 6)) = 12
    and substring(substring(raw.digits from 1 for 4) || substring(raw.digits from 6) from 5 for 1) <> '9'
) as fixed
where wc.id = fixed.id;

-- ---------------------------------------------------------------------------
-- 2) Função fixo: exatamente 12 dígitos e sem 9 após DDD
-- ---------------------------------------------------------------------------
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

comment on function public.phone_number_is_landline(text) is
  'Fixo BR: 55 + DDD (2) + 8 dígitos = 12 dígitos totais, sem 9 após o DDD.';

update public.whatsapp_contacts
set is_landline = public.phone_number_is_landline(phone_number);

-- ---------------------------------------------------------------------------
-- 3) Campanha para um único contato
-- ---------------------------------------------------------------------------
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
