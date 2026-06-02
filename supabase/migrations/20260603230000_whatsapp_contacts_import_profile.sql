-- migration: perfil opcional de importação em whatsapp_contacts
-- purpose: preservar endereço e histórico de compras vindos de planilhas csv/xlsx
-- affected: public.whatsapp_contacts

alter table public.whatsapp_contacts
  add column if not exists import_profile jsonb;

comment on column public.whatsapp_contacts.import_profile is
  'Dados extras da planilha de importação (endereço, compras, datas). Somente leitura operacional no backoffice.';
