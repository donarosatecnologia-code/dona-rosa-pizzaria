-- migration: motivo de falha por destinatário de campanha
-- purpose: exibir no relatório por que o envio falhou (Meta, LGPD, etc.)
-- affected: public.broadcast_campaign_recipients

alter table public.broadcast_campaign_recipients
  add column if not exists failure_reason text;

comment on column public.broadcast_campaign_recipients.failure_reason is
  'Motivo legível quando send_status = failed (erro Meta, sem LGPD, telefone ausente).';
