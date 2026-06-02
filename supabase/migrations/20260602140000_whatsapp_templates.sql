-- migration: whatsapp_templates
-- purpose: modelos de mensagem WhatsApp com submissão e status de aprovação Meta
-- affected tables: whatsapp_templates

create table public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_name text not null,
  category text not null default 'UTILITY',
  language text not null default 'pt_BR',
  body text not null,
  variables jsonb not null default '[]'::jsonb,
  meta_template_id text,
  status text not null default 'draft',
  rejection_reason text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_templates_name_language_unique unique (name, language),
  constraint whatsapp_templates_category_check check (
    category in ('UTILITY', 'MARKETING', 'AUTHENTICATION')
  ),
  constraint whatsapp_templates_status_check check (
    status in ('draft', 'pending', 'approved', 'rejected', 'disabled')
  )
);

comment on table public.whatsapp_templates is
  'Modelos de mensagem WhatsApp — rascunho local, submissão e status sincronizado com a Meta.';

create index idx_whatsapp_templates_status on public.whatsapp_templates using btree (status);
create index idx_whatsapp_templates_name on public.whatsapp_templates using btree (name);
create index idx_whatsapp_templates_meta_template_id on public.whatsapp_templates using btree (meta_template_id);

alter table public.whatsapp_templates enable row level security;

create policy "admin_select_whatsapp_templates" on public.whatsapp_templates
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "admin_insert_whatsapp_templates" on public.whatsapp_templates
  for insert to authenticated
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_update_whatsapp_templates" on public.whatsapp_templates
  for update to authenticated
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));

create policy "admin_delete_whatsapp_templates" on public.whatsapp_templates
  for delete to authenticated
  using ((select public.is_admin((select auth.uid()))));

-- service role (webhook / edge functions) atualiza status
create policy "service_update_whatsapp_templates" on public.whatsapp_templates
  for update to service_role
  using (true)
  with check (true);

create policy "service_select_whatsapp_templates" on public.whatsapp_templates
  for select to service_role
  using (true);
