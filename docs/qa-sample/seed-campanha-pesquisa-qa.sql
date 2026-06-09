-- Campanha de pesquisa sequencial na fila homologacao-qa (dry-run)
-- Pré-requisito: migrations survey_flows + fila QA + contatos com tag qa-homologacao
-- Uso: SQL Editor → copiar campaign_id → npm run broadcast:send -- <id>

do $$
declare
  v_queue_id uuid;
  v_flow_id uuid;
  v_campaign_id uuid;
begin
  select id into v_queue_id
  from public.whatsapp_queues
  where slug = 'homologacao-qa' and is_active = true
  limit 1;

  if v_queue_id is null then
    raise exception 'Fila homologacao-qa não encontrada.';
  end if;

  select id into v_flow_id
  from public.survey_flows
  where slug = 'pesquisa-delivery-2025' and is_active = true
  limit 1;

  if v_flow_id is null then
    raise exception 'Pesquisa pesquisa-delivery-2025 não encontrada. Rode db:deploy.';
  end if;

  insert into public.broadcast_campaigns (
    template_name_draft,
    template_params_draft,
    content_type_draft,
    queue_id_draft,
    survey_flow_id_draft,
    status
  )
  values (
    'teste_homologacao_dona_rosa',
    '{"language":"pt_BR","body":["equipe de testes"]}'::jsonb,
    'survey',
    v_queue_id,
    v_flow_id,
    'draft'
  )
  returning id into v_campaign_id;

  update public.broadcast_campaigns
  set
    template_name = template_name_draft,
    template_params = template_params_draft,
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
  where id = v_campaign_id;

  raise notice 'Campanha pesquisa QA criada: %', v_campaign_id;
end;
$$;

select
  bc.id as campaign_id,
  bc.content_type,
  sf.name as survey_name,
  q.name as queue_name
from public.broadcast_campaigns as bc
join public.survey_flows as sf on sf.id = bc.survey_flow_id
join public.whatsapp_queues as q on q.id = bc.queue_id
order by bc.created_at desc
limit 1;
