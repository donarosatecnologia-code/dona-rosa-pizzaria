-- migration: add per-product pizza size pricing controls
-- purpose: allow each pizza item to enable/disable broto/mini and choose fixed or percentage pricing
-- affected table: public.products

alter table public.products
add column if not exists pizza_has_broto boolean not null default true,
add column if not exists pizza_broto_pricing_mode text not null default 'percentage',
add column if not exists pizza_broto_percentage numeric(6,2) null default 80,
add column if not exists pizza_broto_fixed_price numeric(10,2) null,
add column if not exists pizza_has_mini boolean not null default true,
add column if not exists pizza_mini_pricing_mode text not null default 'percentage',
add column if not exists pizza_mini_percentage numeric(6,2) null default 65,
add column if not exists pizza_mini_fixed_price numeric(10,2) null;

alter table public.products
drop constraint if exists products_pizza_broto_pricing_mode_check,
add constraint products_pizza_broto_pricing_mode_check
check (pizza_broto_pricing_mode in ('percentage', 'fixed'));

alter table public.products
drop constraint if exists products_pizza_mini_pricing_mode_check,
add constraint products_pizza_mini_pricing_mode_check
check (pizza_mini_pricing_mode in ('percentage', 'fixed'));

alter table public.products
drop constraint if exists products_pizza_broto_percentage_check,
add constraint products_pizza_broto_percentage_check
check (pizza_broto_percentage is null or pizza_broto_percentage >= 0);

alter table public.products
drop constraint if exists products_pizza_mini_percentage_check,
add constraint products_pizza_mini_percentage_check
check (pizza_mini_percentage is null or pizza_mini_percentage >= 0);

alter table public.products
drop constraint if exists products_pizza_broto_fixed_price_check,
add constraint products_pizza_broto_fixed_price_check
check (pizza_broto_fixed_price is null or pizza_broto_fixed_price >= 0);

alter table public.products
drop constraint if exists products_pizza_mini_fixed_price_check,
add constraint products_pizza_mini_fixed_price_check
check (pizza_mini_fixed_price is null or pizza_mini_fixed_price >= 0);

alter table public.products
drop constraint if exists products_pizza_broto_configuration_check,
add constraint products_pizza_broto_configuration_check
check (
  (not pizza_has_broto)
  or (
    (pizza_broto_pricing_mode = 'percentage' and pizza_broto_percentage is not null)
    or (pizza_broto_pricing_mode = 'fixed' and pizza_broto_fixed_price is not null)
  )
);

alter table public.products
drop constraint if exists products_pizza_mini_configuration_check,
add constraint products_pizza_mini_configuration_check
check (
  (not pizza_has_mini)
  or (
    (pizza_mini_pricing_mode = 'percentage' and pizza_mini_percentage is not null)
    or (pizza_mini_pricing_mode = 'fixed' and pizza_mini_fixed_price is not null)
  )
);
