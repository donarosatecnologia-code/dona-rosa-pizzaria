-- migration: dedupe respostas por campanha+contato
-- purpose: garantir um voto por contato por campanha (spec fase 4)
-- affected: public.broadcast_responses

-- remove duplicatas mantendo a resposta mais antiga por (campaign_id, contact_id)
delete from public.broadcast_responses as newer
using public.broadcast_responses as older
where newer.campaign_id = older.campaign_id
  and newer.contact_id = older.contact_id
  and (
    newer.received_at > older.received_at
    or (newer.received_at = older.received_at and newer.id > older.id)
  );

alter table public.broadcast_responses
  drop constraint if exists broadcast_responses_campaign_contact_unique;

alter table public.broadcast_responses
  add constraint broadcast_responses_campaign_contact_unique unique (campaign_id, contact_id);

comment on constraint broadcast_responses_campaign_contact_unique on public.broadcast_responses is
  'Um contato só pode registrar uma resposta por campanha de pesquisa/disparo.';
