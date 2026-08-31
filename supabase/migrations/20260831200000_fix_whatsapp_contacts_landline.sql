-- migration: corrige classificação de telefone fixo (apenas formato do número)
-- purpose: remover backfill errado por import_batch_id; marcar só fixos reais (10 dígitos nacionais, sem 9 após DDD)

update public.whatsapp_contacts
set is_landline = false;

update public.whatsapp_contacts
set is_landline = true
where length(regexp_replace(phone_number, '\D', '', 'g')) = 12
  and substring(regexp_replace(phone_number, '\D', '', 'g') from 5 for 1) <> '9';

comment on column public.whatsapp_contacts.is_landline is
  'True quando phone_number tem 10 dígitos nacionais (55+DDD+8), sem o 9 do celular.';
