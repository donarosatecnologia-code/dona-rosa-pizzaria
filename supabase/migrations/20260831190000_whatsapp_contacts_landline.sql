-- migration: coluna is_landline em whatsapp_contacts + tag sistema "Telefone fixo"
-- purpose: identificar contatos de referência (sem WhatsApp) na listagem de clientes

alter table public.whatsapp_contacts
  add column if not exists is_landline boolean not null default false;

comment on column public.whatsapp_contacts.is_landline is
  'True quando o telefone é fixo (sem WhatsApp). Contatos só para consulta interna.';

create index if not exists idx_whatsapp_contacts_is_landline
  on public.whatsapp_contacts using btree (is_landline)
  where is_landline = true;

insert into public.whatsapp_tags (name, slug, description, color, is_system)
values (
  'Telefone fixo',
  'telefone-fixo',
  'Contato sem WhatsApp — apenas consulta interna',
  '#64748b',
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  is_system = excluded.is_system;

-- contatos importados que nunca interagiram via WhatsApp (referência da planilha)
-- (backfill removido na migration 20260831200000 — classificação só pelo formato do número)
