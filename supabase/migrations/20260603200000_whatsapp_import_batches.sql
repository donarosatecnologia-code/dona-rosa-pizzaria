-- migration: whatsapp import batches (fase 2 — gestão de contatos)
-- purpose: rastrear cada importação csv e vincular contatos ao lote de origem
-- affected: public.whatsapp_import_batches (nova), public.whatsapp_contacts (colunas opcionais)

-- ---------------------------------------------------------------------------
-- whatsapp_import_batches
-- ---------------------------------------------------------------------------
create table public.whatsapp_import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text,
  total_rows int not null default 0,
  imported int not null default 0,
  duplicates int not null default 0,
  errors int not null default 0,
  error_details jsonb not null default '[]'::jsonb,
  status text not null default 'processing',
  created_at timestamptz not null default now(),
  constraint whatsapp_import_batches_status_check check (
    status in ('processing', 'completed', 'failed')
  )
);

comment on table public.whatsapp_import_batches is
  'Histórico de importações csv de contatos whatsapp no backoffice.';
comment on column public.whatsapp_import_batches.error_details is
  'Array json: [{ line, value, reason }] — limitado no app a ~100 entradas.';

create index idx_whatsapp_import_batches_created_at
  on public.whatsapp_import_batches using btree (created_at desc);

alter table public.whatsapp_import_batches enable row level security;

create policy "admin_select_whatsapp_import_batches" on public.whatsapp_import_batches
  for select to authenticated
  using ((select private.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_import_batches" on public.whatsapp_import_batches
  for insert to authenticated
  with check ((select private.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_import_batches" on public.whatsapp_import_batches
  for update to authenticated
  using ((select private.is_admin((select auth.uid()))))
  with check ((select private.is_admin((select auth.uid()))));

-- ---------------------------------------------------------------------------
-- whatsapp_contacts — colunas fase 2
-- ---------------------------------------------------------------------------
alter table public.whatsapp_contacts
  add column if not exists opted_out_at timestamptz,
  add column if not exists import_batch_id uuid references public.whatsapp_import_batches (id) on delete set null;

comment on column public.whatsapp_contacts.opted_out_at is
  'Momento em que o contato pediu para parar de receber disparos.';
comment on column public.whatsapp_contacts.import_batch_id is
  'Lote csv que originou o cadastro, quando aplicável.';

create index if not exists idx_whatsapp_contacts_import_batch_id
  on public.whatsapp_contacts using btree (import_batch_id)
  where import_batch_id is not null;
