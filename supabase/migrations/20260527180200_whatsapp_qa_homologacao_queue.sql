-- migration: tag e fila QA para homologação (fase 5)
-- purpose: segmento isolado para testes antes de disparos em produção
-- affected: public.whatsapp_tags, public.whatsapp_queues, public.whatsapp_queue_tags

insert into public.whatsapp_tags (name, slug, description, color, is_system)
values (
  'Homologação QA',
  'qa-homologacao',
  'Contatos de teste — usar apenas em homologação antes do go-live',
  '#0ea5e9',
  true
)
on conflict (slug) do nothing;

insert into public.whatsapp_queues (name, slug, description, include_match, exclude_match)
values (
  'Homologação QA',
  'homologacao-qa',
  'Apenas contatos marcados com tag qa-homologacao (mín. 3 números de teste)',
  'any',
  'any'
)
on conflict (slug) do nothing;

insert into public.whatsapp_queue_tags (queue_id, tag_id, rule_type)
select q.id, t.id, 'include'
from public.whatsapp_queues as q
join public.whatsapp_tags as t on t.slug = 'qa-homologacao'
where q.slug = 'homologacao-qa'
on conflict do nothing;
