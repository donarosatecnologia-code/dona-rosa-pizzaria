-- Teste de campanha hello_world (modo teste Meta)
-- Rode no Supabase SQL Editor — não use placeholder UUID; este script gera tudo automaticamente.

do $$
declare
  v_queue_id uuid;
  v_campaign_id uuid;
begin
  -- 1) Fila: todos os contatos active (sem tag obrigatória)
  insert into public.whatsapp_queues (name, slug, description, include_match, exclude_match)
  values ('Teste disparo', 'teste-disparo', 'Todos os contatos active', 'any', 'any')
  on conflict (slug) do update set updated_at = now()
  returning id into v_queue_id;

  if v_queue_id is null then
    select id into v_queue_id from public.whatsapp_queues where slug = 'teste-disparo';
  end if;

  -- 2) Campanha rascunho
  insert into public.broadcast_campaigns (
    template_name_draft,
    template_params_draft,
    content_type_draft,
    queue_id_draft,
    status
  )
  values (
    'hello_world',
    '{"language":"en_US"}'::jsonb,
    'informational',
    v_queue_id,
    'draft'
  )
  returning id into v_campaign_id;

  -- 3) Publicar rascunho → colunas publicadas (SQL Editor roda como postgres, sem auth.uid())
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

  raise notice 'Campanha criada e publicada: %', v_campaign_id;
  raise notice 'Próximo passo: invocar broadcast-send com campaign_id=% (admin logado)', v_campaign_id;
end $$;

-- Verificar campanha publicada
select id, template_name, queue_id, published_at, status
from public.broadcast_campaigns
order by created_at desc
limit 1;
