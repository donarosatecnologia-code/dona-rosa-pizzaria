-- migration: idempotência em whatsapp_webhook_events (fase 1)
-- purpose: evitar reprocessamento quando a Meta reenvia o mesmo payload de webhook
-- affected: public.whatsapp_webhook_events (coluna dedupe_key + índice único parcial)

alter table public.whatsapp_webhook_events
  add column if not exists dedupe_key text;

comment on column public.whatsapp_webhook_events.dedupe_key is
  'Chave derivada do payload Meta (message id, status id, etc.) para deduplicar reenvios.';

create unique index if not exists idx_whatsapp_webhook_events_dedupe_key
  on public.whatsapp_webhook_events using btree (dedupe_key)
  where dedupe_key is not null;
