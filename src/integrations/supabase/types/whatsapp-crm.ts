/** Tipos CRM WhatsApp — alinhar com npm run db:types após migration CRM. */

export type WhatsappConfigStatus = "active" | "inactive";

export interface WhatsappConfig {
  id: number;
  phone_number_id: string;
  display_name: string | null;
  status: WhatsappConfigStatus;
  webhook_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WhatsappConversationStatus = "open" | "closed" | "pending";

export interface WhatsappConversation {
  id: string;
  wa_id: string;
  contact_name: string | null;
  status: WhatsappConversationStatus;
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  last_message_direction: "inbound" | "outbound" | null;
  contact_removed_at: string | null;
  whatsapp_contact_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WhatsappMessageDirection = "inbound" | "outbound";

export type WhatsappMessageStatus = "received" | "sent" | "delivered" | "read" | "failed";

export interface WhatsappMessage {
  id: string;
  conversation_id: string;
  meta_message_id: string | null;
  direction: WhatsappMessageDirection;
  message_type: string;
  content: Record<string, unknown>;
  body_text: string | null;
  status: WhatsappMessageStatus;
  deleted_at: string | null;
  created_at: string;
}

export interface WhatsappWebhookEvent {
  id: string;
  event_type: string;
  phone_number_id: string | null;
  raw_payload: Record<string, unknown>;
  processed: boolean;
  processing_error: string | null;
  created_at: string;
}

export interface WhatsappConversationWithPreview extends WhatsappConversation {
  whatsapp_messages?: Pick<WhatsappMessage, "id" | "body_text" | "direction" | "created_at" | "status">[];
}
