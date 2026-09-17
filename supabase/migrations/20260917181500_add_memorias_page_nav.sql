-- Página Memórias: link interno apenas (sem menus).
-- Seed do título editável + remoção de links de nav se tiverem sido criados.

-- 1) Remover Memórias do header e do rodapé (página não entra nos menus públicos)
delete from public.nav_links
where url = '/memorias'
  and column_key in ('header', 'navegacao');

-- 2) Título mínimo da página (editável no mirror)
insert into public.page_contents (page_key, section_key, title, content, is_active)
select v.page_key, v.section_key, v.title, v.content, true
from (
  values
    ('memorias', 'mem-page-title', 'Memórias'::text, null::text)
) as v (page_key, section_key, title, content)
where not exists (
  select 1
  from public.page_contents as p
  where p.page_key = v.page_key
    and p.section_key = v.section_key
);
