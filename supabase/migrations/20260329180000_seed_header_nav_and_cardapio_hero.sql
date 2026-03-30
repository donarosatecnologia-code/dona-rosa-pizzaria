-- Links do menu superior (column_key = header) quando ainda não existir nenhum.
-- Textos do hero do cardápio em page_contents quando ainda não existirem.

insert into public.nav_links (label, url, column_key, sort_order)
select
  v.label,
  v.url,
  v.column_key,
  v.sort_order
from (
  values
    ('Quem Somos', '/quem-somos', 'header', 0),
    ('Cardápio', '/cardapio', 'header', 1),
    ('Espaços', '/espacos', 'header', 2),
    ('Cursos e Eventos', '/cursos-e-eventos', 'header', 3),
    ('Saúde e Sustentabilidade', '/saude-e-sustentabilidade', 'header', 4)
) as v (label, url, column_key, sort_order)
where not exists (
  select 1
  from public.nav_links as n
  where n.column_key = 'header'
);

insert into public.page_contents (page_key, section_key, title, content, is_active)
select v.page_key, v.section_key, v.title, v.content, true
from (
  values
    ('cardapio', 'cardapio-hero-title', 'Nosso Cardápio'::text, null::text),
    (
      'cardapio',
      'cardapio-hero-subtitle',
      null::text,
      'Pratos preparados com ingredientes selecionados e muito carinho artesanal.'::text
    )
) as v (page_key, section_key, title, content)
where not exists (
  select 1
  from public.page_contents as p
  where p.page_key = v.page_key
    and p.section_key = v.section_key
);

insert into public.page_contents (page_key, section_key, title, content, is_active)
select v.page_key, v.section_key, v.title, v.content, true
from (
  values
    ('footer', 'footer-title-social', 'Redes sociais'::text, null::text),
    ('footer', 'footer-title-nav', 'Navegação'::text, null::text),
    ('footer', 'footer-title-cardapio', 'Cardápio'::text, null::text),
    ('footer', 'footer-title-col4', 'Horário e contato'::text, null::text)
) as v (page_key, section_key, title, content)
where not exists (
  select 1
  from public.page_contents as p
  where p.page_key = v.page_key
    and p.section_key = v.section_key
);
