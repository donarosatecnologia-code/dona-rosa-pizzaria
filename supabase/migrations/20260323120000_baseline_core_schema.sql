-- migration: baseline core schema (idempotente)
-- purpose: tabelas base exigidas pelas migrations seguintes; permite supabase start / db reset local.
-- affected: users, categories, products, page_contents, set_updated_at()
-- special considerations: create if not exists — seguro em remoto já provisionado

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'user',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "public_read_categories" on public.categories;
create policy "public_read_categories" on public.categories
  for select to anon, authenticated
  using (is_active = true);

create table if not exists public.products (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  short_description text,
  price numeric(10, 2) not null,
  image_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "public_read_products" on public.products;
create policy "public_read_products" on public.products
  for select to anon, authenticated
  using (is_active = true);

create index if not exists idx_products_category_id on public.products using btree (category_id);

create table if not exists public.page_contents (
  id bigint generated always as identity primary key,
  page_key text not null,
  section_key text not null,
  title text,
  content text,
  subtitle text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_key, section_key)
);

alter table public.page_contents enable row level security;

drop policy if exists "public_read_page_contents" on public.page_contents;
create policy "public_read_page_contents" on public.page_contents
  for select to anon, authenticated
  using (is_active = true);

create index if not exists idx_page_contents_page_section on public.page_contents using btree (page_key, section_key);

comment on table public.users is 'Perfis de usuário; role admin controla acesso ao backoffice.';
comment on table public.categories is 'Categorias do cardápio.';
comment on table public.products is 'Produtos do cardápio.';
comment on table public.page_contents is 'Conteúdo CMS por page_key + section_key.';
