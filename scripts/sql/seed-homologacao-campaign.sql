-- Cria campanha de homologação na fila QA
-- IMPORTANTE: com BROADCAST_DRY_RUN=true não precisa de template na Meta.
-- Com BROADCAST_DRY_RUN=false o template DEVE existir e estar APROVADO em /admin/templates.
-- Rode no Supabase SQL Editor. Copie o campaign_id para: npm run broadcast:send -- <id>

do $$
declare
  v_queue_id uuid;
  v_campaign_id uuid;
begin
  select id into v_queue_id
  from public.whatsapp_queues
  where slug = 'homologacao-qa' and is_active = true
  limit 1;

  if v_queue_id is null then
    raise exception 'Fila homologacao-qa não encontrada. Rode npm run db:deploy.';
  end if;

  insert into public.broadcast_campaigns (
    template_name_draft,
    template_params_draft,
    content_type_draft,
    queue_id_draft,
    status
  )
  values (
    'teste_homologacao_dona_rosa',
    '{"language":"pt_BR","body":["equipe de testes"]}'::jsonb,
    'informational',
    v_queue_id,
    'draft'
  )
  returning id into v_campaign_id;

  update public.broadcast_campaigns
  set
    template_name = template_name_draft,
    template_params = template_params_draft,
    content_type = coalesce(content_type_draft, content_type),
    queue_id = queue_id_draft,
    published_at = now(),
    template_name_draft = null,
    template_params_draft = null,
    content_type_draft = null,
    queue_id_draft = null,
    updated_at = now()
  where id = v_campaign_id;

  raise notice 'Campanha homologação publicada: %', v_campaign_id;
  raise notice 'Contatos na fila: %', (
    select count(*) from public.resolve_queue_contact_ids(v_queue_id)
  );
  raise notice 'Próximo: npm run broadcast:send -- %', v_campaign_id;
end $$;

select
  c.id,
  c.template_name,
  c.status,
  c.published_at,
  (select count(*) from public.resolve_queue_contact_ids(c.queue_id)) as destinatarios_elegiveis
from public.broadcast_campaigns as c
where c.queue_id = (select id from public.whatsapp_queues where slug = 'homologacao-qa' limit 1)
order by c.created_at desc
limit 1;
