-- migration: sincroniza is_landline com o formato do phone_number (trigger + backfill)
-- purpose: coluna is_landline alinhada à tag/filtro Telefone fixo na UI

create or replace function public.phone_number_is_landline(p_phone text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with normalized as (
    select regexp_replace(p_phone, '\D', '', 'g') as digits
  )
  select
    digits like '55%'
    and length(digits) in (12, 13)
    and substring(digits from 5 for 1) <> '9'
  from normalized;
$$;

comment on function public.phone_number_is_landline(text) is
  'True para fixo BR armazenado: 55+DDD+8 dígitos (12 total) ou sem 9 após DDD (13 total).';

create or replace function public.sync_whatsapp_contact_is_landline()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.is_landline := public.phone_number_is_landline(new.phone_number);
  return new;
end;
$$;

drop trigger if exists sync_whatsapp_contact_is_landline_trigger on public.whatsapp_contacts;

create trigger sync_whatsapp_contact_is_landline_trigger
before insert or update of phone_number on public.whatsapp_contacts
for each row
execute function public.sync_whatsapp_contact_is_landline();

update public.whatsapp_contacts
set is_landline = public.phone_number_is_landline(phone_number);
