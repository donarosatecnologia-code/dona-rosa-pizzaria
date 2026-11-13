-- purpose: stop stale survey sessions from hijacking pizza orders, and keep
--          survey bot replies from removing conversations from the waiting queue.
-- affected: public.survey_sessions, public.whatsapp_messages, public.whatsapp_conversations

-- Sessões paradas há mais de 24h não devem mais interceptar o chat.
update public.survey_sessions
set
  status = 'abandoned',
  updated_at = now()
where
  status = 'in_progress'
  and coalesce(updated_at, started_at) < (now() - interval '24 hours');

-- Mensagens da pesquisa são automáticas: não contam como resposta da equipe.
update public.whatsapp_messages
set is_automated = true
where
  direction = 'outbound'
  and is_automated = false
  and (
    content ? 'survey_part'
    or content ? 'survey_step_id'
    or body_text ilike 'Oi! Tudo bem? Estamos fazendo uma pesquisa%'
    or body_text ilike '*Pergunta % de %*'
    or body_text ilike 'Obrigada por responder!%'
    or body_text ilike 'Não entendi essa opção.%'
  );

with last_msgs as (
  select
    conversation_id,
    max(created_at) filter (where direction = 'inbound') as last_in,
    max(created_at) filter (where direction = 'outbound' and not is_automated) as last_out_human
  from public.whatsapp_messages
  where deleted_at is null
  group by conversation_id
)
update public.whatsapp_conversations as conversations
set
  last_inbound_at = last_msgs.last_in,
  last_outbound_at = last_msgs.last_out_human,
  last_message_direction = case
    when last_msgs.last_in is null then conversations.last_message_direction
    when last_msgs.last_out_human is null then 'inbound'
    when last_msgs.last_in > last_msgs.last_out_human then 'inbound'
    else 'outbound'
  end,
  updated_at = now()
from last_msgs
where
  conversations.id = last_msgs.conversation_id
  and conversations.deleted_at is null;
