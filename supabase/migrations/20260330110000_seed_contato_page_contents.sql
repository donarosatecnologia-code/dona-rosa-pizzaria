-- Textos da página Contato quando ainda não existir linha por section_key (site + espelho admin).

insert into public.page_contents (page_key, section_key, title, content, subtitle, is_active)
select v.page_key, v.section_key, v.title, v.content, v.subtitle, true
from (
  values
    ('contato', 'contact-s1-title', 'Entre em contato!'::text, null::text, null::text),
    (
      'contato',
      'contact-s1-desc',
      null::text,
      'Delivery com atendimento pessoal. Por aqui nada de robôs! Ligue e fale com algum de nossos atendentes para pedir a sua pizza:'::text,
      null::text
    ),
    ('contato', 'contact-phone-1', null::text, '(11) 2389-0220'::text, null::text),
    ('contato', 'contact-phone-2', null::text, '(11) 3021-7676'::text, null::text),
    ('contato', 'contact-email', null::text, 'donarosapizzaria@gmail.com'::text, null::text),
    (
      'contato',
      'contact-address',
      null::text,
      'Rua Caminha de Amorim, 242 – Alto de Pinheiros (Vila Jataí), São Paulo - SP, 05451-020'::text,
      null::text
    ),
    ('contato', 'contact-s2-title', 'Reserve sua mesa'::text, null::text, null::text),
    (
      'contato',
      'contact-s2-desc',
      null::text,
      'Reserve sua mesa por mensagem, clique no ícone abaixo para falar com a gente por WhatsApp:'::text,
      null::text
    ),
    (
      'contato',
      'contact-s2-hours',
      null::text,
      E'Terça - Quinta: 18:30 - 23:30\nSexta - Sábado: 18:30 - 00:30\nDomingo: 18:30 - 22:30'::text,
      null::text
    ),
    ('contato', 'contact-s3-title', 'Fale conosco'::text, null::text, null::text)
) as v (page_key, section_key, title, content, subtitle)
where not exists (
  select 1
  from public.page_contents as p
  where p.page_key = v.page_key
    and p.section_key = v.section_key
);
