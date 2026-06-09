-- Configura contatos de teste na fila Homologação QA
-- Rode no Supabase SQL Editor após importar os números no /admin/contatos
--
-- Substitua os telefones abaixo pelos 3 números reais da equipe (só dígitos, sem +)

do $$
declare
  v_tag_id uuid;
  v_phone text;
  v_contact_id uuid;
  v_phones text[] := array[
    '5511999990001',  -- Janaina (exemplo)
    '5511999990002',  -- Rosa (exemplo)
    '5511999990003'   -- Equipe (exemplo)
  ];
begin
  select id into v_tag_id from public.whatsapp_tags where slug = 'qa-homologacao' limit 1;

  if v_tag_id is null then
    raise exception 'Tag qa-homologacao não encontrada. Rode npm run db:deploy.';
  end if;

  foreach v_phone in array v_phones
  loop
    select id into v_contact_id
    from public.whatsapp_contacts
    where phone_number = v_phone and status = 'active'
    limit 1;

    if v_contact_id is null then
      raise notice 'Contato não encontrado (importe antes): %', v_phone;
      continue;
    end if;

    if not exists (
      select 1 from public.whatsapp_contacts
      where id = v_contact_id and terms_accepted_at is not null
    ) then
      raise notice 'Contato % sem terms_accepted_at — marque LGPD na importação', v_phone;
      continue;
    end if;

    insert into public.whatsapp_contact_tags (contact_id, tag_id, assigned_by)
    values (v_contact_id, v_tag_id, 'admin')
    on conflict do nothing;

    raise notice 'Tag QA aplicada: %', v_phone;
  end loop;
end $$;

-- Verificar quantos contatos entram na fila QA
select count(*) as contatos_na_fila_qa
from public.resolve_queue_contact_ids(
  (select id from public.whatsapp_queues where slug = 'homologacao-qa' limit 1)
);
