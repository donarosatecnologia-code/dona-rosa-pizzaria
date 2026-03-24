-- migration: align wine metadata with country_origin and carafe pricing
-- purpose:
-- 1) add country_origin, price_half_carafe and price_carafe fields
-- 2) backfill from existing origin_country, price_half_pitcher and price_pitcher
-- 3) keep backward compatibility with existing data

alter table public.products
add column if not exists country_origin text,
add column if not exists price_half_carafe numeric(10,2),
add column if not exists price_carafe numeric(10,2);

update public.products
set country_origin = coalesce(country_origin, origin_country)
where country_origin is null
  and origin_country is not null;

update public.products
set price_half_carafe = coalesce(price_half_carafe, price_half_pitcher)
where price_half_carafe is null
  and price_half_pitcher is not null;

update public.products
set price_carafe = coalesce(price_carafe, price_pitcher)
where price_carafe is null
  and price_pitcher is not null;

alter table public.products
drop constraint if exists products_house_wine_prices_check;

alter table public.products
add constraint products_house_wine_prices_check
check (
  is_house_wine = false
  or price_glass is not null
  or price_half_carafe is not null
  or price_carafe is not null
);

create index if not exists idx_products_country_origin on public.products using btree (country_origin);
