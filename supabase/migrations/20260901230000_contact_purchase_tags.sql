-- migration: etiquetas automáticas por histórico de compras
-- purpose: cliente-ativo/inativo/frequente/vip/unica-compra com base em compras e dias sem comprar
-- affected: public.refresh_contact_engagement, public.whatsapp_tags, public.whatsapp_contact_tags

-- ---------------------------------------------------------------------------
-- etiquetas de sistema (compras)
-- ---------------------------------------------------------------------------
insert into public.whatsapp_tags (name, slug, description, color, is_system)
values
  (
    'Cliente frequente',
    'cliente-frequente',
    'Mais de 50 compras totais',
    '#8b5cf6',
    true
  ),
  (
    'Única compra',
    'unica-compra',
    'Exatamente 1 compra registrada',
    '#0ea5e9',
    true
  )
on conflict (slug) do update
set
  description = excluded.description,
  is_system = true;

update public.whatsapp_tags
set
  description = 'Comprou entre 1 e 99 dias atrás',
  is_system = true
where slug = 'cliente-ativo';

update public.whatsapp_tags
set
  description = 'Mais de 100 dias sem comprar',
  is_system = true
where slug = 'cliente-inativo';

update public.whatsapp_tags
set
  description = 'Cliente ativo com mais de 100 compras',
  is_system = true
where slug = 'vip';

-- ---------------------------------------------------------------------------
-- recalcula etiquetas de compra (substitui regra antiga por inbound)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_contact_engagement(p_contact_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_purchase_count integer;
  v_last_purchase date;
  v_days integer;
  v_level text;
  v_slug text;
  v_tag_id uuid;
  v_desired_slugs text[] := array[]::text[];
begin
  select purchase_count, last_purchase_at
  into v_purchase_count, v_last_purchase
  from public.whatsapp_contacts
  where id = p_contact_id;

  if v_last_purchase is not null then
    v_days := (current_date - v_last_purchase)::integer;
  end if;

  if v_days is null then
    v_level := 'unknown';
  elsif v_days >= 1 and v_days <= 99 then
    v_level := 'active';
  elsif v_days > 100 then
    v_level := 'cold';
  else
    v_level := 'warm';
  end if;

  update public.whatsapp_contacts
  set engagement_level = v_level, updated_at = now()
  where id = p_contact_id;

  if v_purchase_count = 1 then
    v_desired_slugs := array_append(v_desired_slugs, 'unica-compra');
  end if;

  if coalesce(v_purchase_count, 0) > 50 then
    v_desired_slugs := array_append(v_desired_slugs, 'cliente-frequente');
  end if;

  if v_days is not null and v_days > 100 then
    v_desired_slugs := array_append(v_desired_slugs, 'cliente-inativo');
  end if;

  if v_days is not null and v_days >= 1 and v_days <= 99 then
    v_desired_slugs := array_append(v_desired_slugs, 'cliente-ativo');
  end if;

  if v_days is not null and v_days >= 1 and v_days <= 99 and coalesce(v_purchase_count, 0) > 100 then
    v_desired_slugs := array_append(v_desired_slugs, 'vip');
  end if;

  delete from public.whatsapp_contact_tags as wct
  using public.whatsapp_tags as wt
  where wct.contact_id = p_contact_id
    and wct.tag_id = wt.id
    and wt.slug = any (
      array[
        'cliente-ativo',
        'cliente-inativo',
        'cliente-frequente',
        'vip',
        'unica-compra'
      ]
    )
    and not (wt.slug = any (v_desired_slugs));

  foreach v_slug in array v_desired_slugs
  loop
    select id into v_tag_id
    from public.whatsapp_tags
    where slug = v_slug
    limit 1;

    if v_tag_id is not null then
      insert into public.whatsapp_contact_tags (contact_id, tag_id, assigned_by)
      values (p_contact_id, v_tag_id, 'system')
      on conflict (contact_id, tag_id) do nothing;
    end if;
  end loop;
end;
$$;

comment on function public.refresh_contact_engagement(uuid) is
  'Recalcula engagement_level e etiquetas de compra (ativo/inativo/frequente/vip/unica-compra).';

-- ---------------------------------------------------------------------------
-- trigger: ao alterar compras ou última compra
-- ---------------------------------------------------------------------------
create or replace function public.trg_refresh_contact_purchase_tags()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_contact_engagement(new.id);
  return new;
end;
$$;

drop trigger if exists refresh_contact_purchase_tags_trigger on public.whatsapp_contacts;

create trigger refresh_contact_purchase_tags_trigger
after insert or update of purchase_count, last_purchase_at on public.whatsapp_contacts
for each row
execute function public.trg_refresh_contact_purchase_tags();

-- ---------------------------------------------------------------------------
-- refresh em lote (admin / pós-importação)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_all_contact_purchase_tags()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contact_id uuid;
  v_count integer := 0;
begin
  if not (select private.is_admin((select auth.uid()))) then
    raise exception 'not_admin';
  end if;

  for v_contact_id in
    select id from public.whatsapp_contacts
  loop
    perform public.refresh_contact_engagement(v_contact_id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function public.refresh_all_contact_purchase_tags() is
  'Recalcula etiquetas de compra de todos os contatos (uso admin, ex.: abrir lista de clientes).';

grant execute on function public.refresh_all_contact_purchase_tags() to authenticated;

-- backfill
do $$
declare
  v_contact_id uuid;
begin
  for v_contact_id in
    select id from public.whatsapp_contacts
  loop
    perform public.refresh_contact_engagement(v_contact_id);
  end loop;
end;
$$;
