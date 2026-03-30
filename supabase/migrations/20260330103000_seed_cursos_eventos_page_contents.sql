-- Garante textos da página Cursos e Eventos quando ainda não existir linha por section_key.
-- Títulos/subtítulos visíveis no site e no espelho após migrar rascunhos.

insert into public.page_contents (page_key, section_key, title, content, subtitle, is_active)
select v.page_key, v.section_key, v.title, v.content, v.subtitle, true
from (
  values
    ('cursos-e-eventos', 'courses-s1-title', 'Espaço de Eventos', null::text, null::text),
    ('cursos-e-eventos', 'courses-s1-subtitle', null::text, 'Faça seu evento na Dona Rosa!', null::text),
    (
      'cursos-e-eventos',
      'courses-s1-body',
      null::text,
      'Montamos um cardápio personalizado com suas pizzas preferidas e oferecemos comandas individuais para facilitar a organização no Espaço Gourmet com forno a lenha exclusivo para a sua festa.'::text,
      null::text
    ),
    ('cursos-e-eventos', 'courses-s2-title', 'Curso de Pizza', null::text, null::text),
    ('cursos-e-eventos', 'courses-s2-subtitle', null::text, 'Aprenda a fazer a pizza da Dona Rosa!', null::text),
    (
      'cursos-e-eventos',
      'courses-s2-body',
      null::text,
      'Curso prático com massa, molho e forno: leve a experiência Dona Rosa para a sua cozinha.'::text,
      null::text
    ),
    ('cursos-e-eventos', 'courses-s3-title', 'Dona Rosa em casa', null::text, null::text),
    (
      'cursos-e-eventos',
      'courses-s3-subtitle',
      null::text,
      'Leve a pizzaria Dona Rosa para seu evento!'::text,
      null::text
    ),
    (
      'cursos-e-eventos',
      'courses-s3-body',
      null::text,
      'Levamos forno a lenha e equipe para preparar pizzas no local, com cardápio sob medida para a sua ocasião.'::text,
      null::text
    ),
    ('cursos-e-eventos', 'courses-form-title', 'Inscreva-se!', null::text, null::text),
    ('cursos-e-eventos', 'courses-s1-cta', 'Contate Agora!'::text, '#inscricao'::text, null::text),
    ('cursos-e-eventos', 'courses-s2-cta', 'Inscreva-se!'::text, '#inscricao'::text, null::text),
    ('cursos-e-eventos', 'courses-s3-cta', 'Contate Agora!'::text, '#inscricao'::text, null::text)
) as v (page_key, section_key, title, content, subtitle)
where not exists (
  select 1
  from public.page_contents as p
  where p.page_key = v.page_key
    and p.section_key = v.section_key
);
