-- Popula o menu "Navegação" do rodapé apenas quando ainda não existir nenhum link
-- com column_key = 'navegacao' (instalações novas). Não sobrescreve dados existentes.

insert into public.nav_links (label, url, column_key, sort_order)
select
  v.label,
  v.url,
  v.column_key,
  v.sort_order
from (
  values
    ('Espaços', '/espacos', 'navegacao', 0),
    ('Cursos e Eventos', '/cursos-e-eventos', 'navegacao', 1),
    ('Saúde e Sustentabilidade', '/saude-e-sustentabilidade', 'navegacao', 2),
    ('Contato', '/contato', 'navegacao', 3)
) as v (label, url, column_key, sort_order)
where not exists (
  select 1
  from public.nav_links as n
  where n.column_key = 'navegacao'
);
