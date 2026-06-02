-- Diagnóstico pós-disparo: substitua o campaign_id se necessário
-- campaign_id de teste: 7088c78d-5c17-4b50-afb1-6da6c4cba37a

-- 1) Status do destinatário (sent → delivered/read ou failed)
select
  r.send_status,
  r.meta_message_id,
  r.sent_at,
  r.delivered_at,
  c.phone_number,
  c.name
from public.broadcast_campaign_recipients as r
join public.whatsapp_contacts as c on c.id = r.contact_id
where r.campaign_id = '7088c78d-5c17-4b50-afb1-6da6c4cba37a';

-- 2) Eventos webhook recentes (procure statuses failed ou errors)
select
  event_type,
  processed,
  processing_error,
  created_at,
  raw_payload->'statuses' as statuses
from public.whatsapp_webhook_events
order by created_at desc
limit 10;

-- 3) Mensagem CRM outbound
select direction, body_text, status, meta_message_id, created_at
from public.whatsapp_messages
where meta_message_id = 'wamid.HBgNNTUxMTk3NDI3NDQxNhUCABEYEjcxRTg4MUVFRjJDMEY0MEExQQA='
   or direction = 'outbound'
order by created_at desc
limit 5;

-- 4) Redisparo (UPDATE deve afetar 1 linha; "No rows returned" = id/campaign errado ou já pending)
-- update public.broadcast_campaign_recipients
-- set send_status = 'pending', meta_message_id = null, sent_at = null, delivered_at = null
-- where campaign_id = '7088c78d-5c17-4b50-afb1-6da6c4cba37a';
-- update public.broadcast_campaigns
-- set status = 'draft', total_sent = 0, total_delivered = 0
-- where id = '7088c78d-5c17-4b50-afb1-6da6c4cba37a';
