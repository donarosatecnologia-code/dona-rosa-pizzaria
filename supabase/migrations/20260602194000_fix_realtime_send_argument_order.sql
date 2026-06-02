-- Corrige ordem dos argumentos em realtime.send().
-- Assinatura correta: realtime.send(payload jsonb, event text, topic text, is_private boolean)
-- As funções anteriores passavam (topic, event, payload, is_private), causando rollback em todo INSERT.

-- ---------------------------------------------------------------------------
-- CRM: nova mensagem → admin:whatsapp:crm
-- ---------------------------------------------------------------------------
create or replace function public.notify_whatsapp_crm_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id', new.id,
      'conversation_id', new.conversation_id,
      'direction', new.direction,
      'message_type', new.message_type,
      'body_text', new.body_text,
      'status', new.status,
      'created_at', new.created_at
    ),
    'message_created'::text,
    'admin:whatsapp:crm'::text,
    true
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Inbox: notificação inbound → admin:whatsapp:notifications
-- ---------------------------------------------------------------------------
create or replace function public.notify_whatsapp_inbound_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.whatsapp_conversations%rowtype;
  v_title text;
  v_notification_id uuid;
begin
  if new.direction <> 'inbound' then
    return new;
  end if;

  select * into v_conversation
  from public.whatsapp_conversations
  where id = new.conversation_id;

  v_title := coalesce(v_conversation.contact_name, v_conversation.wa_id);

  insert into public.whatsapp_admin_notifications (
    event_type,
    title,
    body,
    href,
    conversation_id,
    payload
  )
  values (
    'inbound_message',
    v_title || ' enviou mensagem',
    left(coalesce(new.body_text, 'Nova mensagem'), 120),
    '/admin/conversas/' || new.conversation_id::text,
    new.conversation_id,
    jsonb_build_object(
      'message_id', new.id,
      'conversation_id', new.conversation_id,
      'wa_id', v_conversation.wa_id
    )
  )
  returning id into v_notification_id;

  perform realtime.send(
    jsonb_build_object(
      'id', v_notification_id,
      'event_type', 'inbound_message',
      'conversation_id', new.conversation_id
    ),
    'notification_created'::text,
    'admin:whatsapp:notifications'::text,
    true
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Broadcasts: resposta de pesquisa → admin:whatsapp:broadcasts
-- ---------------------------------------------------------------------------
create or replace function public.notify_survey_response_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id', new.id,
      'campaign_id', new.campaign_id,
      'contact_id', new.contact_id,
      'response_value', new.response_value,
      'received_at', new.received_at
    ),
    'survey_response_received'::text,
    'admin:whatsapp:broadcasts'::text,
    false
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Broadcasts: resposta genérica → admin:whatsapp:broadcasts
-- ---------------------------------------------------------------------------
create or replace function public.notify_broadcast_response_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id', new.id,
      'campaign_id', new.campaign_id,
      'contact_id', new.contact_id,
      'response_value', new.response_value,
      'response_type', new.response_type,
      'received_at', new.received_at
    ),
    'broadcast_response_received'::text,
    'admin:whatsapp:broadcasts'::text,
    false
  );
  return new;
end;
$$;
