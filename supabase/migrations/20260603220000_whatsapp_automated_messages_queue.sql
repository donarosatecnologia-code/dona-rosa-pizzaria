-- migration: mensagens automáticas não removem conversa da fila "esperando resposta"
-- purpose: prompts de termos e respostas automáticas não atualizam last_outbound_at / last_message_direction
-- affected: public.whatsapp_messages, public.update_conversation_on_new_message()

alter table public.whatsapp_messages
  add column if not exists is_automated boolean not null default false;

comment on column public.whatsapp_messages.is_automated is
  'true = mensagem automática (ex.: prompt de termos); não conta como resposta da equipe na fila.';

create or replace function public.update_conversation_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.whatsapp_conversations
  set
    last_message_at = new.created_at,
    last_inbound_at = case
      when new.direction = 'inbound' then new.created_at
      else last_inbound_at
    end,
    last_outbound_at = case
      when new.direction = 'outbound' and not coalesce(new.is_automated, false) then new.created_at
      else last_outbound_at
    end,
    last_message_direction = case
      when new.direction = 'outbound' and coalesce(new.is_automated, false) then last_message_direction
      else new.direction
    end,
    status = case
      when new.direction = 'inbound' then 'open'
      else status
    end,
    updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

-- marcar mensagens automáticas já enviadas (prompt de termos)
update public.whatsapp_messages
set is_automated = true
where direction = 'outbound'
  and (
    content->>'type' = 'terms_consent_prompt'
    or body_text like 'Olá! Antes de continuar o atendimento%'
    or body_text like 'Obrigado! Confirmamos seu aceite%'
  );

-- recalcular fila das conversas existentes
with last_msgs as (
  select
    conversation_id,
    max(created_at) filter (where direction = 'inbound') as last_in,
    max(created_at) filter (where direction = 'outbound' and not is_automated) as last_out_human
  from public.whatsapp_messages
  where deleted_at is null
  group by conversation_id
)
update public.whatsapp_conversations as c
set
  last_inbound_at = lm.last_in,
  last_outbound_at = lm.last_out_human,
  last_message_direction = case
    when lm.last_in is null then c.last_message_direction
    when lm.last_out_human is null then 'inbound'
    when lm.last_in > lm.last_out_human then 'inbound'
    else 'outbound'
  end,
  updated_at = now()
from last_msgs as lm
where c.id = lm.conversation_id
  and c.deleted_at is null;
