-- migration: rascunho de pesquisa vinculada à campanha
-- purpose: publicar campanha com survey_flow_id

alter table public.broadcast_campaigns
  add column if not exists survey_flow_id_draft uuid references public.survey_flows (id) on delete set null;

comment on column public.broadcast_campaigns.survey_flow_id_draft is
  'Pesquisa sequencial em rascunho — copiada para survey_flow_id na publicação.';

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
    published_at = now(),
    template_name_draft = null,
    template_params_draft = null,
    content_type_draft = null,
    queue_id_draft = null,
    survey_flow_id_draft = null,
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
    );

  if not found then
    raise exception 'campaign not found, not in draft, or nothing to publish';
  end if;
end;
$$;
