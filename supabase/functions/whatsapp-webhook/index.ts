import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  logWebhookEvent,
  markWebhookEventProcessed,
  persistInboundCrmMessage,
  touchWhatsappConfig,
  updateCrmMessageStatus,
  type WebhookChangeContext,
} from "../_shared/crm-persistence.ts";
import { mapMetaStatusToLocal } from "../_shared/meta-graph-api.ts";
import {
  extractResponseValue,
  normalizePhoneNumber,
  resolveResponseType,
  verifyMetaWebhookSignature,
  type MetaWebhookMessage,
  type MetaWebhookPayload,
} from "../_shared/meta-webhook.ts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Connection: "keep-alive",
};

console.info("whatsapp-webhook started");

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    return handleVerification(url);
  }

  if (req.method === "POST") {
    return handleWebhook(req);
  }

  return new Response(JSON.stringify({ error: "method_not_allowed" }), {
    status: 405,
    headers: JSON_HEADERS,
  });
});

function handleVerification(url: URL): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expectedToken = Deno.env.get("META_VERIFY_TOKEN");

  if (mode === "subscribe" && token && challenge && expectedToken && token === expectedToken) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return new Response(JSON.stringify({ error: "verification_failed" }), {
    status: 403,
    headers: JSON_HEADERS,
  });
}

async function handleWebhook(req: Request): Promise<Response> {
  const appSecret = Deno.env.get("META_APP_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!appSecret || !supabaseUrl || !serviceRole) {
    console.error("missing_env: META_APP_SECRET, SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "missing_env" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-hub-signature-256");
  const isValid = await verifyMetaWebhookSignature(rawBody, signatureHeader, appSecret);

  if (!isValid) {
    console.error("invalid_hmac_signature", {
      hasHeader: Boolean(signatureHeader),
      bodyLength: rawBody.length,
    });
    return new Response(JSON.stringify({ error: "invalid_signature" }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  EdgeRuntime.waitUntil(processWebhookPayload(supabase, payload));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

async function processWebhookPayload(
  supabase: ReturnType<typeof createClient>,
  payload: MetaWebhookPayload,
): Promise<void> {
  console.info("webhook_payload", {
    object: payload.object,
    entries: payload.entry?.length ?? 0,
  });

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) {
        continue;
      }

      const ctx: WebhookChangeContext = {
        field: change.field,
        phoneNumberId: value.metadata?.phone_number_id,
        displayPhoneNumber: value.metadata?.display_phone_number,
        contacts: value.contacts as WebhookChangeContext["contacts"],
        rawValue: value as Record<string, unknown>,
      };

      console.info("webhook_change", {
        field: change.field,
        phoneNumberId: ctx.phoneNumberId,
        messages: value.messages?.length ?? 0,
        statuses: value.statuses?.length ?? 0,
      });

      const eventId = await logWebhookEvent(supabase, ctx);

      try {
        await touchWhatsappConfig(supabase, ctx.phoneNumberId, ctx.displayPhoneNumber);

        if (change.field === "message_template_status_update") {
          await handleTemplateStatusUpdate(supabase, value as Record<string, unknown>);
          await markWebhookEventProcessed(supabase, eventId);
          continue;
        }

        for (const status of value.statuses ?? []) {
          await handleDeliveryStatus(
            supabase,
            status.id,
            status.status,
            status.recipient_id,
            status.errors,
          );
        }

        for (const message of value.messages ?? []) {
          await handleInboundMessage(supabase, message, ctx);
        }

        await markWebhookEventProcessed(supabase, eventId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "processing_failed";
        console.error("webhook_change_failed", message);
        await markWebhookEventProcessed(supabase, eventId, message);
      }
    }
  }
}

async function handleDeliveryStatus(
  supabase: ReturnType<typeof createClient>,
  metaMessageId: string,
  status: string,
  recipientPhone: string,
  errors?: Array<{ code?: number; title?: string; message?: string; error_data?: { details?: string } }>,
): Promise<void> {
  if (!metaMessageId) {
    return;
  }

  if (status === "failed" && errors?.length) {
    console.error("meta_delivery_failed", {
      metaMessageId,
      recipientPhone,
      errors,
    });
  }

  await updateCrmMessageStatus(supabase, metaMessageId, status);

  const normalizedPhone = normalizePhoneNumber(recipientPhone);
  const now = new Date().toISOString();

  if (status === "sent") {
    await supabase
      .from("broadcast_campaign_recipients")
      .update({ send_status: "sent", sent_at: now })
      .eq("meta_message_id", metaMessageId);
    return;
  }

  if (status === "delivered" || status === "read") {
    const { data: recipient } = await supabase
      .from("broadcast_campaign_recipients")
      .select("id, campaign_id, contact_id, send_status")
      .eq("meta_message_id", metaMessageId)
      .maybeSingle();

    if (!recipient || recipient.send_status === "delivered" || recipient.send_status === "read") {
      return;
    }

    await supabase
      .from("broadcast_campaign_recipients")
      .update({
        send_status: status === "read" ? "read" : "delivered",
        delivered_at: now,
      })
      .eq("id", recipient.id);

    await supabase.rpc("increment_broadcast_campaign_delivered", {
      p_campaign_id: recipient.campaign_id,
    });

    return;
  }

  if (status === "failed") {
    await supabase
      .from("broadcast_campaign_recipients")
      .update({ send_status: "failed" })
      .eq("meta_message_id", metaMessageId);
  }

  if (normalizedPhone) {
    console.info("delivery_status", { metaMessageId, status, normalizedPhone });
  }
}

async function handleInboundMessage(
  supabase: ReturnType<typeof createClient>,
  message: MetaWebhookMessage,
  ctx: WebhookChangeContext,
): Promise<void> {
  const phone = normalizePhoneNumber(message.from);
  if (!phone) {
    console.warn("inbound_skipped", { reason: "missing_from", messageId: message.id });
    return;
  }

  console.info("inbound_received", { phone, type: message.type, messageId: message.id });

  const now = new Date().toISOString();
  let contact = await ensureActiveContact(supabase, phone);

  await persistInboundCrmMessage(supabase, message, ctx, contact?.id ?? null);

  if (!contact) {
    console.info("inbound_skipped", { phone, reason: "contact_missing_or_opted_out" });
    return;
  }

  const { error: engagementError } = await supabase
    .from("whatsapp_contacts")
    .update({
      last_inbound_at: now,
      inbound_count: (contact.inbound_count ?? 0) + 1,
      updated_at: now,
    })
    .eq("id", contact.id);

  if (engagementError) {
    console.error("inbound_engagement_update_failed", engagementError.message);
    return;
  }

  await supabase.rpc("refresh_contact_engagement", { p_contact_id: contact.id });

  const responseValue = extractResponseValue(message);
  if (!responseValue) {
    console.info("inbound_stored_engagement_only", { phone, type: message.type });
    return;
  }

  const responseType = resolveResponseType(message);

  const { data: recipient } = await supabase
    .from("broadcast_campaign_recipients")
    .select("campaign_id")
    .eq("contact_id", contact.id)
    .in("send_status", ["sent", "delivered", "read"])
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!recipient) {
    console.info("inbound_no_campaign_recipient", { phone, responseValue });
    return;
  }

  const { error } = await supabase.from("broadcast_responses").insert({
    campaign_id: recipient.campaign_id,
    contact_id: contact.id,
    response_value: responseValue,
    response_type: responseType,
    meta_message_id: message.id,
    received_at: now,
  });

  if (error && error.code !== "23505") {
    console.error("broadcast_response_insert_failed", error.message);
  }
}

/** Garante contato ativo; cria automaticamente se inbound vier de número desconhecido (modo teste). */
async function ensureActiveContact(
  supabase: ReturnType<typeof createClient>,
  phone: string,
): Promise<{ id: string; status: string; inbound_count: number | null } | null> {
  const { data: existing } = await supabase
    .from("whatsapp_contacts")
    .select("id, status, inbound_count")
    .eq("phone_number", phone)
    .maybeSingle();

  if (existing) {
    if (existing.status === "opted_out") {
      return null;
    }
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("whatsapp_contacts")
    .insert({
      phone_number: phone,
      name: phone,
      status: "active",
    })
    .select("id, status, inbound_count")
    .single();

  if (insertError) {
    console.error("inbound_contact_upsert_failed", insertError.message, { phone });
    return null;
  }

  console.info("inbound_contact_created", { phone });
  return created;
}

async function handleTemplateStatusUpdate(
  supabase: ReturnType<typeof createClient>,
  value: Record<string, unknown>,
): Promise<void> {
  const event = typeof value.event === "string" ? value.event : "";
  const templateName =
    typeof value.message_template_name === "string" ? value.message_template_name : null;
  const language =
    typeof value.message_template_language === "string" ? value.message_template_language : null;
  const metaId = value.message_template_id != null ? String(value.message_template_id) : null;
  const reason =
    typeof value.reason === "string" && value.reason !== "NONE" ? value.reason : null;

  if (!templateName) {
    return;
  }

  const status = mapMetaStatusToLocal(event);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
    rejection_reason: status === "rejected" ? reason : null,
  };

  if (metaId) {
    patch.meta_template_id = metaId;
  }
  if (status === "approved") {
    patch.approved_at = now;
  }

  let query = supabase.from("whatsapp_templates").update(patch).eq("name", templateName);
  if (language) {
    query = query.eq("language", language);
  }

  const { error } = await query;
  if (error) {
    console.error("template_status_update_failed", error.message, { templateName, event });
  } else {
    console.info("template_status_updated", { templateName, status, event });
  }
}
