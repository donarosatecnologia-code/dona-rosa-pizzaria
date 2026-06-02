/** Tipos das tabelas de Disparos Ativos WhatsApp — alinhar com npm run db:types após migration. */

export type WhatsappContactStatus = "active" | "opted_out";

export type EngagementLevel = "active" | "warm" | "cold" | "unknown";

export type WhatsappImportBatchStatus = "processing" | "completed" | "failed";

export interface WhatsappImportBatch {
  id: string;
  filename: string | null;
  total_rows: number;
  imported: number;
  duplicates: number;
  errors: number;
  error_details: Array<{ line: number; value: string; reason: string }>;
  status: WhatsappImportBatchStatus;
  created_at: string;
}

export type WhatsappTermsSource =
  | "site_widget"
  | "site_contact_form"
  | "site_reserve"
  | "whatsapp";

export interface ContactImportProfile {
  logr?: string;
  street?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string;
  purchase_count?: string;
  purchase_total?: string;
  registered_at?: string;
  last_purchase_at?: string;
  days_without_purchase?: string;
  full_address?: string;
}

export interface WhatsappContact {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  status: WhatsappContactStatus;
  opted_out_at: string | null;
  terms_accepted_at: string | null;
  terms_accepted_source: WhatsappTermsSource | null;
  terms_prompt_sent_at: string | null;
  import_batch_id: string | null;
  import_profile: ContactImportProfile | null;
  engagement_level: EngagementLevel;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  inbound_count: number;
  created_at: string;
  updated_at: string;
}

export type BroadcastContentType =
  | "survey"
  | "promotion"
  | "informational"
  | "utility"
  | "reminder";

export type BroadcastCampaignStatus = "draft" | "sending" | "completed";

export interface BroadcastCampaign {
  id: string;
  template_name: string | null;
  template_name_draft: string | null;
  template_params: Record<string, unknown> | null;
  template_params_draft: Record<string, unknown> | null;
  content_type: BroadcastContentType | null;
  content_type_draft: BroadcastContentType | null;
  queue_id: string | null;
  queue_id_draft: string | null;
  status: BroadcastCampaignStatus;
  total_sent: number;
  total_delivered: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface WhatsappTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  is_system: boolean;
  created_at: string;
}

export interface WhatsappContactTag {
  contact_id: string;
  tag_id: string;
  assigned_at: string;
  assigned_by: "admin" | "system" | "import";
}

export type QueueTagMatchMode = "any" | "all";

export interface WhatsappQueue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  include_match: QueueTagMatchMode;
  exclude_match: QueueTagMatchMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type QueueTagRuleType = "include" | "exclude";

export interface WhatsappQueueTag {
  queue_id: string;
  tag_id: string;
  rule_type: QueueTagRuleType;
}

export type BroadcastRecipientSendStatus = "pending" | "sent" | "delivered" | "failed" | "read";

export interface BroadcastCampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  meta_message_id: string | null;
  send_status: BroadcastRecipientSendStatus;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export type BroadcastResponseType = "survey" | "reply" | "button" | "reaction" | "other";

export interface BroadcastResponse {
  id: string;
  campaign_id: string;
  contact_id: string;
  response_value: string;
  response_type: BroadcastResponseType;
  received_at: string;
  meta_message_id: string | null;
}

/** @deprecated Use BroadcastResponse */
export type SurveyResponse = BroadcastResponse;

/** Colunas publicadas — únicas que o motor de envio deve ler. */
export type PublishedBroadcastCampaign = Pick<
  BroadcastCampaign,
  "id" | "template_name" | "template_params" | "content_type" | "queue_id" | "status" | "published_at"
> & {
  template_name: string;
  content_type: BroadcastContentType;
  queue_id: string;
  published_at: string;
};

/** Regras de negócio — Disparos Ativos */
export const BROADCAST_BUSINESS_RULES = {
  BR_CONTENT_TYPES:
    "Campanhas suportam survey, promotion, informational, utility e reminder — não apenas pesquisas.",
  BR_QUEUE_FROM_TAGS:
    "Filas são segmentos definidos por tags include/exclude; contato pode estar em múltiplas filas via tags.",
  BR_ENGAGEMENT:
    "engagement_level e tags cliente-ativo/cliente-inativo são recalculados após inbound (webhook).",
  BR_MOTOR_READS_PUBLISHED:
    "Motor de envio lê content_type, queue_id e template publicados — nunca colunas *_draft.",
  BR_RESOLVE_QUEUE: "Destinatários da campanha = resolve_queue_contact_ids(queue_id) ∩ status active.",
} as const;
