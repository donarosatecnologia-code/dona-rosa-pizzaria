-- migration: fix get_admin_dashboard_stats contacts_count
-- purpose: whatsapp_contacts não possui deleted_at (exclusão física com auditoria)

create or replace function public.get_admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid;
  v_result jsonb;
begin
  v_uid := (select auth.uid());

  if not private.is_admin(v_uid) then
    raise exception 'not_admin';
  end if;

  select jsonb_build_object(
    'products_count', (select count(*)::int from public.products),
    'categories_count', (select count(*)::int from public.categories),
    'contents_count', (select count(*)::int from public.page_contents),
    'contacts_count', (select count(*)::int from public.whatsapp_contacts),
    'conversations_open', (
      select count(*)::int
      from public.whatsapp_conversations
      where deleted_at is null
        and status = 'open'
    ),
    'conversations_waiting', (
      select count(*)::int
      from public.whatsapp_conversations
      where deleted_at is null
        and status <> 'closed'
        and last_message_direction = 'inbound'
    ),
    'conversations_by_status', (
      select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb)
      from (
        select c.status as name, count(*)::int as value
        from public.whatsapp_conversations as c
        where c.deleted_at is null
        group by c.status
      ) as s
    ),
    'messages_by_day', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'day', d.day,
            'inbound', d.inbound,
            'outbound', d.outbound
          )
          order by d.sort_key
        ),
        '[]'::jsonb
      )
      from (
        select
          date_trunc('day', m.created_at at time zone 'America/Sao_Paulo') as sort_key,
          to_char(date_trunc('day', m.created_at at time zone 'America/Sao_Paulo'), 'DD/MM') as day,
          count(*) filter (where m.direction = 'inbound')::int as inbound,
          count(*) filter (where m.direction = 'outbound')::int as outbound
        from public.whatsapp_messages as m
        where m.created_at >= now() - interval '7 days'
        group by date_trunc('day', m.created_at at time zone 'America/Sao_Paulo')
      ) as d
    ),
    'campaigns_summary', (
      select coalesce(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      from (
        select
          bc.id,
          coalesce(nullif(trim(bc.template_name), ''), nullif(trim(bc.template_name_draft), ''), 'Campanha') as name,
          bc.status,
          bc.total_sent,
          bc.total_delivered,
          bc.created_at
        from public.broadcast_campaigns as bc
        order by bc.created_at desc
        limit 5
      ) as c
    ),
    'templates_approved', (
      select count(*)::int
      from public.whatsapp_templates
      where status = 'approved'
    )
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_admin_dashboard_stats() to authenticated;
