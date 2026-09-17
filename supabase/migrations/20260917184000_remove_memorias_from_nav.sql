-- Garante que Memórias não apareça nos menus (caso a migration
-- anterior já tenha inserido os links em algum ambiente).

delete from public.nav_links
where url = '/memorias'
  and column_key in ('header', 'navegacao');
