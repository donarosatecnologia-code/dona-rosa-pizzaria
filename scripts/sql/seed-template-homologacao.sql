-- Rascunho do template de homologação (T11) — submeter à Meta só após App Review
insert into public.whatsapp_templates (
  name,
  display_name,
  category,
  language,
  body,
  variables,
  status
)
values (
  'teste_homologacao_dona_rosa',
  'Teste homologação Dona Rosa',
  'UTILITY',
  'pt_BR',
  'Olá! Esta é uma mensagem de teste da Dona Rosa Pizzaria. Por favor, ignore — estamos homologando nosso sistema. 🍕',
  '[]'::jsonb,
  'draft'
)
on conflict (name, language) do update set
  display_name = excluded.display_name,
  body = excluded.body,
  updated_at = now();

select id, name, status, display_name
from public.whatsapp_templates
where name = 'teste_homologacao_dona_rosa';
