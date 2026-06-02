import type { SupabaseClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  extractResponseValue,
  normalizePhoneNumber,
  type MetaWebhookMessage,
} from "./meta-webhook.ts";

export interface WebhookChangeContext {
  field: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  rawValue: Record<string, unknown>;
}

/** Persiste evento bruto para auditoria (dr-fase1). */
export async function logWebhookEvent(
  supabase: SupabaseClient,
  ctx: WebhookChangeContext,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("whatsapp_webhook_events")
    .insert({
      event_type: ctx.field,
      phone_number_id: ctx.phoneNumberId ?? null,
      raw_payload: ctx.rawValue,
      processed: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("webhook_event_log_failed", error.message);
    return null;
  }

  return data.id as string;
}

export async function markWebhookEventProcessed(
  supabase: SupabaseClient,
  eventId: string | null,
  errorMessage?: string,
): Promise<void> {
  if (!eventId) {
    return;
  }

  await supabase
    .from("whatsapp_webhook_events")
    .update({
      processed: !errorMessage,
      processing_error: errorMessage ?? null,
    })
    .eq("id", eventId);
}

export async function touchWhatsappConfig(
  supabase: SupabaseClient,
  phoneNumberId?: string,
  displayPhoneNumber?: string,
): Promise<void> {
  if (!phoneNumberId) {
    return;
  }

  await supabase.rpc("upsert_whatsapp_config_active", {
    p_phone_number_id: phoneNumberId,
    p_display_name: displayPhoneNumber ?? null,
  });
}

function resolveContactName(
  waId: string,
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>,
): string | null {
  const match = contacts?.find((c) => c.wa_id === waId);
  return match?.profile?.name?.trim() ?? null;
}

function extractBodyText(message: MetaWebhookMessage): string | null {
  return extractResponseValue(message);
}

/** Upsert conversa CRM por wa_id; retorna conversation_id. */
export async function upsertConversation(
  supabase: SupabaseClient,
  waId: string,
  options?: {
    contactName?: string | null;
    whatsappContactId?: string | null;
    lastMessageAt?: string;
  },
): Promise<string | null> {
  const now = options?.lastMessageAt ?? new Date().toISOString();

  const { data: existing } = await supabase
    .from("whatsapp_conversations")
    .select("id, contact_name")
    .eq("wa_id", waId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("whatsapp_conversations")
      .update({
        contact_name: options?.contactName ?? existing.contact_name,
        whatsapp_contact_id: options?.whatsappContactId ?? undefined,
        last_message_at: now,
        status: "open",
        updated_at: now,
      })
      .eq("id", existing.id);

    return existing.id as string;
  }

  const { data: created, error } = await supabase
    .from("whatsapp_conversations")
    .insert({
      wa_id: waId,
      contact_name: options?.contactName ?? waId,
      whatsapp_contact_id: options?.whatsappContactId ?? null,
      last_message_at: now,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    console.error("crm_conversation_upsert_failed", error.message, { waId });
    return null;
  }

  return created.id as string;
}

/** Persiste mensagem inbound no CRM (idempotente por meta_message_id). */
export async function persistInboundCrmMessage(
  supabase: SupabaseClient,
  message: MetaWebhookMessage,
  ctx: WebhookChangeContext,
  whatsappContactId?: string | null,
): Promise<void> {
  const waId = normalizePhoneNumber(message.from);
  if (!waId || !message.id) {
    return;
  }

  const contactName = resolveContactName(waId, ctx.contacts);
  const conversationId = await upsertConversation(supabase, waId, {
    contactName,
    whatsappContactId,
    lastMessageAt: new Date().toISOString(),
  });

  if (!conversationId) {
    return;
  }

  const bodyText = extractBodyText(message);

  const { error } = await supabase.from("whatsapp_messages").insert({
    conversation_id: conversationId,
    meta_message_id: message.id,
    direction: "inbound",
    message_type: message.type,
    content: message as unknown as Record<string, unknown>,
    body_text: bodyText,
    status: "received",
  });

  if (error && error.code !== "23505") {
    console.error("crm_inbound_message_failed", error.message);
  }
}

/** Atualiza status de mensagem outbound/inbound via webhook de delivery. */
export async function updateCrmMessageStatus(
  supabase: SupabaseClient,
  metaMessageId: string,
  status: string,
): Promise<void> {
  const mapped = mapDeliveryStatus(status);
  if (!mapped) {
    return;
  }

  await supabase
    .from("whatsapp_messages")
    .update({ status: mapped })
    .eq("meta_message_id", metaMessageId);
}

function mapDeliveryStatus(status: string): string | null {
  if (status === "sent" || status === "delivered" || status === "read" || status === "failed") {
    return status;
  }
  return null;
}

/** Persiste mensagem outbound no CRM (usado pelo broadcast-send futuramente). */
export async function persistOutboundCrmMessage(
  supabase: SupabaseClient,
  input: {
    waId: string;
    metaMessageId: string;
    messageType?: string;
    bodyText?: string | null;
    content?: Record<string, unknown>;
    whatsappContactId?: string | null;
  },
): Promise<void> {
  const conversationId = await upsertConversation(supabase, input.waId, {
    whatsappContactId: input.whatsappContactId,
    lastMessageAt: new Date().toISOString(),
  });

  if (!conversationId) {
    return;
  }

  const { error } = await supabase.from("whatsapp_messages").insert({
    conversation_id: conversationId,
    meta_message_id: input.metaMessageId,
    direction: "outbound",
    message_type: input.messageType ?? "template",
    content: input.content ?? {},
    body_text: input.bodyText,
    status: "sent",
  });

  if (error && error.code !== "23505") {
    console.error("crm_outbound_message_failed", error.message);
  }
}
