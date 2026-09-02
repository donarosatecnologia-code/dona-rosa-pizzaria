-- migration: campos cadastrais de clientes (endereço, compras, datas)
-- purpose: colunas dedicadas para lista/detalhe de clientes e importação da planilha
-- affected: public.whatsapp_contacts

alter table public.whatsapp_contacts
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists address_neighborhood text,
  add column if not exists purchase_count integer,
  add column if not exists purchase_total numeric(12, 2),
  add column if not exists registered_at date,
  add column if not exists last_purchase_at date;

comment on column public.whatsapp_contacts.address_street is
  'Logradouro/endereço do cliente (coluna ENDERECO da planilha).';
comment on column public.whatsapp_contacts.address_number is
  'Número do endereço (coluna NUMERO da planilha).';
comment on column public.whatsapp_contacts.address_complement is
  'Complemento do endereço.';
comment on column public.whatsapp_contacts.address_neighborhood is
  'Bairro do cliente.';
comment on column public.whatsapp_contacts.purchase_count is
  'Quantidade total de compras (coluna TOTAL/COMPRAS).';
comment on column public.whatsapp_contacts.purchase_total is
  'Valor total em compras R$ (coluna R$/COMPRAS).';
comment on column public.whatsapp_contacts.registered_at is
  'Data de cadastro do cliente; fixada na primeira mensagem WhatsApp ou importação.';
comment on column public.whatsapp_contacts.last_purchase_at is
  'Data da última compra; editável manualmente no backoffice.';

create index if not exists idx_whatsapp_contacts_registered_at
  on public.whatsapp_contacts using btree (registered_at desc nulls last);

create index if not exists idx_whatsapp_contacts_last_purchase_at
  on public.whatsapp_contacts using btree (last_purchase_at desc nulls last);

-- backfill a partir de import_profile legado (jsonb)
update public.whatsapp_contacts as wc
set
  address_street = coalesce(
    wc.address_street,
    nullif(trim(concat_ws(' ', wc.import_profile->>'logr', wc.import_profile->>'street')), '')
  ),
  address_number = coalesce(wc.address_number, nullif(wc.import_profile->>'address_number', '')),
  address_complement = coalesce(wc.address_complement, nullif(wc.import_profile->>'complement', '')),
  address_neighborhood = coalesce(wc.address_neighborhood, nullif(wc.import_profile->>'neighborhood', '')),
  purchase_count = coalesce(
    wc.purchase_count,
    case
      when (wc.import_profile->>'purchase_count') ~ '^\d+$'
        then (wc.import_profile->>'purchase_count')::integer
      else null
    end
  ),
  purchase_total = coalesce(
    wc.purchase_total,
    case
      when wc.import_profile->>'purchase_total' is not null
        then nullif(
          regexp_replace(wc.import_profile->>'purchase_total', '[^0-9,.-]', '', 'g'),
          ''
        )::numeric
      else null
    end
  )
where wc.import_profile is not null;

-- dias sem comprar é calculado no app (current_date - last_purchase_at)
