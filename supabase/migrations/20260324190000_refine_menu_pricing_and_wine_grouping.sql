-- migration: refine menu pricing and wine grouping metadata
-- purpose:
-- 1) support pizza section footer notes and automatic size pricing flags per category
-- 2) support wine grouping by origin country and house-wine multi-pricing fields per product
-- special considerations:
-- - non-destructive migration (additive only)
-- - preserves compatibility with current frontend by keeping existing price column untouched

alter table public.categories
add column if not exists has_pizza_size_pricing boolean not null default false,
add column if not exists footer_note_extra text,
add column if not exists footer_note_slices text,
add column if not exists footer_note_flour text;

comment on column public.categories.has_pizza_size_pricing is 'flags categories that should render automatic pizza size prices (broto and mini) from the large/base price.';
comment on column public.categories.footer_note_extra is 'first footer line rendered at the bottom of the category section.';
comment on column public.categories.footer_note_slices is 'second footer line rendered at the bottom of the category section.';
comment on column public.categories.footer_note_flour is 'third footer line rendered at the bottom of the category section.';

alter table public.products
add column if not exists origin_country text,
add column if not exists is_house_wine boolean not null default false,
add column if not exists price_glass numeric(10,2),
add column if not exists price_half_pitcher numeric(10,2),
add column if not exists price_pitcher numeric(10,2);

comment on column public.products.origin_country is 'country of origin used to subgroup wines on the menu (e.g. argentina, chile, portugal).';
comment on column public.products.is_house_wine is 'when true, product can expose multiple prices (glass, half pitcher, pitcher).';
comment on column public.products.price_glass is 'house wine price per glass.';
comment on column public.products.price_half_pitcher is 'house wine price per half pitcher.';
comment on column public.products.price_pitcher is 'house wine price per pitcher.';

alter table public.products
drop constraint if exists products_house_wine_prices_check;

alter table public.products
add constraint products_house_wine_prices_check
check (
  is_house_wine = false
  or price_glass is not null
  or price_half_pitcher is not null
  or price_pitcher is not null
);

create index if not exists idx_products_origin_country on public.products using btree (origin_country);
