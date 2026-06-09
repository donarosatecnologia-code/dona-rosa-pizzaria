-- migration: fonte de consentimento para importação CSV
-- purpose: permitir marcar terms_accepted_at em contatos importados com confirmação LGPD
-- affected: public.whatsapp_contacts

alter table public.whatsapp_contacts
  drop constraint if exists whatsapp_contacts_terms_accepted_source_check;

alter table public.whatsapp_contacts
  add constraint whatsapp_contacts_terms_accepted_source_check check (
    terms_accepted_source is null
    or terms_accepted_source in (
      'site_widget',
      'site_contact_form',
      'site_reserve',
      'whatsapp',
      'csv_import'
    )
  );

comment on column public.whatsapp_contacts.terms_accepted_source is
  'Origem do consentimento LGPD: site, whatsapp, csv_import (importação com confirmação no admin).';
