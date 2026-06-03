import { persistOutboundCrmMessage } from "../_shared/crm-persistence.ts";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";
import {
  MetaApiError,
  parseTemplateParams,
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from "../_shared/meta-graph-api.ts";
import { AuthError, createServiceClient, requireAdmin } from "../_shared/supabase-auth.ts";

console.info("whatsapp-send-message started");

interface SendMessageRequest {
  action?: "text" | "template";
  conversation_id?: string;
  body_text?: string;
  template_id?: string;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) {
    return preflight;
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    await requireAdmin(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonResponse({ error: error.code }, error.status);
    }
    throw error;
  }

  let body: SendMessageRequest;
  try {
    body = (await req.json()) as SendMessageRequest;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const conversationId = body.conversation_id?.trim();
  if (!conversationId) {
    return jsonResponse({ error: "conversation_id_required" }, 400);
  }

  const isDryRun = Deno.env.get("BROADCAST_DRY_RUN") === "true";
  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID");

  if (!isDryRun && (!accessToken || !phoneNumberId)) {
    return jsonResponse({ error: "missing_meta_env" }, 500);
  }

  const supabase = createServiceClient();

  const { data: conversation, error: convError } = await supabase
    .from("whatsapp_conversations")
    .select("id, wa_id, whatsapp_contact_id, last_inbound_at, contact_removed_at")
    .eq("id", conversationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (convError || !conversation) {
    return jsonResponse({ error: "conversation_not_found" }, 404);
  }

  try {
    if (body.action === "text") {
      return await handleTextSend(
        supabase,
        conversation,
        body.body_text,
        isDryRun,
        accessToken ?? "",
        phoneNumberId ?? "",
      );
    }

    if (body.action === "template") {
      return await handleTemplateSend(
        supabase,
        conversation,
        body.template_id,
        isDryRun,
        accessToken ?? "",
        phoneNumberId ?? "",
      );
    }

    return jsonResponse({ error: "unknown_action" }, 400);
  } catch (error) {
    if (error instanceof MetaApiError) {
      const isNotRegistered =
        error.metaCode === 133010 ||
        error.message.toLowerCase().includes("account not registered");
      if (isNotRegistered) {
        return jsonResponse({
          ok: false,
          error: "whatsapp_not_registered",
          message:
            "Número não registrado na Cloud API. Conclua a coexistência (status CONNECTED) em Conectar WhatsApp.",
        }, 400);
      }
      return jsonResponse(
        { ok: false, error: "meta_api_error", message: error.message },
        error.status >= 400 && error.status < 600 ? error.status : 502,
      );
    }
    console.error("whatsapp_send_message_error", error);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});

interface ConversationRow {
  id: string;
  wa_id: string;
  whatsapp_contact_id: string | null;
  last_inbound_at: string | null;
  contact_removed_at: string | null;
}

async function isServiceWindowOpen(
  supabase: ReturnType<typeof createServiceClient>,
  conversationId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_whatsapp_service_window_open", {
    p_conversation_id: conversationId,
  });
  if (error) {
    throw error;
  }
  return Boolean(data);
}

async function handleTextSend(
  supabase: ReturnType<typeof createServiceClient>,
  conversation: ConversationRow,
  bodyText: string | undefined,
  isDryRun: boolean,
  accessToken: string,
  phoneNumberId: string,
): Promise<Response> {
  const text = bodyText?.trim();
  if (!text) {
    return jsonResponse({ error: "body_text_required" }, 400);
  }

  const windowOpen = await isServiceWindowOpen(supabase, conversation.id);
  if (!windowOpen) {
    return jsonResponse({
      ok: false,
      error: "service_window_closed",
      message: "Janela de 24h encerrada. Use um modelo aprovado.",
    }, 400);
  }

  const messageId = isDryRun
    ? `dry_run_${crypto.randomUUID()}`
    : (await sendWhatsAppText(accessToken, phoneNumberId, {
        to: conversation.wa_id,
        body: text,
      })).messageId;

  await persistOutboundCrmMessage(supabase, {
    waId: conversation.wa_id,
    metaMessageId: messageId,
    messageType: "text",
    bodyText: text,
    content: { dry_run: isDryRun },
    whatsappContactId: conversation.whatsapp_contact_id,
  });

  return jsonResponse({
    ok: true,
    dry_run: isDryRun,
    message_id: messageId,
    conversation_id: conversation.id,
  }, 200);
}

async function handleTemplateSend(
  supabase: ReturnType<typeof createServiceClient>,
  conversation: ConversationRow,
  templateId: string | undefined,
  isDryRun: boolean,
  accessToken: string,
  phoneNumberId: string,
): Promise<Response> {
  if (!templateId?.trim()) {
    return jsonResponse({ error: "template_id_required" }, 400);
  }

  const { data: template, error: tplError } = await supabase
    .from("whatsapp_templates")
    .select("id, name, language, body, variables, status")
    .eq("id", templateId)
    .eq("status", "approved")
    .is("archived_at", null)
    .maybeSingle();

  if (tplError || !template) {
    return jsonResponse({ error: "template_not_found_or_not_approved" }, 404);
  }

  const variables = (template.variables ?? []) as Array<{ index: number; example: string }>;
  const templateParams = {
    language: template.language ?? "pt_BR",
    body: variables.sort((a, b) => a.index - b.index).map((v) => v.example),
  };
  const parsed = parseTemplateParams(templateParams);

  const messageId = isDryRun
    ? `dry_run_${crypto.randomUUID()}`
    : (await sendWhatsAppTemplate(accessToken, phoneNumberId, {
        to: conversation.wa_id,
        templateName: template.name,
        languageCode: parsed.languageCode,
        components: parsed.components,
      })).messageId;

  await persistOutboundCrmMessage(supabase, {
    waId: conversation.wa_id,
    metaMessageId: messageId,
    messageType: "template",
    bodyText: template.body,
    content: { template_name: template.name, template_id: template.id, dry_run: isDryRun },
    whatsappContactId: conversation.whatsapp_contact_id,
  });

  return jsonResponse({
    ok: true,
    dry_run: isDryRun,
    message_id: messageId,
    conversation_id: conversation.id,
  }, 200);
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return jsonWithCors(body, status);
}
