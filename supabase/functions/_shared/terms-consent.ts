import type { SupabaseClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  sendWhatsAppInteractiveButtons,
  sendWhatsAppText,
} from "./meta-graph-api.ts";
import { persistOutboundCrmMessage } from "./crm-persistence.ts";
import type { MetaWebhookMessage } from "./meta-webhook.ts";

export const TERMS_BUTTON_ACCEPT = "terms_accept";
export const TERMS_BUTTON_DECLINE = "terms_decline";

export interface ContactConsentRow {
  id: string;
  status: string;
  inbound_count: number | null;
  terms_accepted_at: string | null;
  terms_prompt_sent_at: string | null;
}

function getPublicSiteUrl(): string {
  const fromEnv = Deno.env.get("PUBLIC_SITE_URL")?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return "https://donarosapizzaria.com.br";
}

export function buildTermsPromptBody(): string {
  const base = getPublicSiteUrl();
  return (
    `Olá! Antes de continuar o atendimento, confirme que leu e concorda com nossos Termos de Uso e Política de Privacidade.\n\n` +
    `Termos: ${base}/termos-de-uso\n` +
    `Privacidade: ${base}/politica-de-privacidade`
  );
}

export function parseTermsConsentReply(message: MetaWebhookMessage): "accept" | "decline" | null {
  if (message.type === "interactive" && message.interactive?.button_reply?.id) {
    const id = message.interactive.button_reply.id;
    if (id === TERMS_BUTTON_ACCEPT) {
      return "accept";
    }
    if (id === TERMS_BUTTON_DECLINE) {
      return "decline";
    }
  }

  if (message.type === "button" && message.button?.payload) {
    const payload = message.button.payload;
    if (payload === TERMS_BUTTON_ACCEPT) {
      return "accept";
    }
    if (payload === TERMS_BUTTON_DECLINE) {
      return "decline";
    }
  }

  return null;
}

export async function recordTermsConsentReply(
  supabase: SupabaseClient,
  contactId: string,
  decision: "accept" | "decline",
): Promise<void> {
  const now = new Date().toISOString();

  if (decision === "accept") {
    await supabase
      .from("whatsapp_contacts")
      .update({
        terms_accepted_at: now,
        terms_accepted_source: "whatsapp",
        updated_at: now,
      })
      .eq("id", contactId)
      .is("terms_accepted_at", null);

    await sendWhatsAppTextConfirmation(supabase, contactId);
    return;
  }

  await supabase
    .from("whatsapp_contacts")
    .update({
      status: "opted_out",
      opted_out_at: now,
      updated_at: now,
    })
    .eq("id", contactId);
}

async function sendWhatsAppTextConfirmation(
  supabase: SupabaseClient,
  contactId: string,
): Promise<void> {
  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID");
  const isDryRun = Deno.env.get("BROADCAST_DRY_RUN") === "true";

  if (isDryRun || !accessToken || !phoneNumberId) {
    return;
  }

  const { data: contact } = await supabase
    .from("whatsapp_contacts")
    .select("phone_number")
    .eq("id", contactId)
    .maybeSingle();

  if (!contact?.phone_number) {
    return;
  }

  try {
    const { messageId } = await sendWhatsAppText(accessToken, phoneNumberId, {
      to: contact.phone_number,
      body: "Obrigado! Confirmamos seu aceite. Em instantes nossa equipe continua o atendimento. 🍕",
    });

    await persistOutboundCrmMessage(supabase, {
      waId: contact.phone_number,
      metaMessageId: messageId,
      messageType: "text",
      bodyText: "Obrigado! Confirmamos seu aceite. Em instantes nossa equipe continua o atendimento. 🍕",
      whatsappContactId: contactId,
      isAutomated: true,
    });
  } catch (error) {
    console.error("terms_accept_confirmation_failed", error);
  }
}

export async function sendTermsConsentPrompt(
  supabase: SupabaseClient,
  contact: ContactConsentRow,
  waId: string,
): Promise<boolean> {
  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID");
  const isDryRun = Deno.env.get("BROADCAST_DRY_RUN") === "true";

  if (isDryRun) {
    console.info("terms_prompt_skipped_dry_run", { contactId: contact.id, waId });
    await supabase
      .from("whatsapp_contacts")
      .update({ terms_prompt_sent_at: new Date().toISOString() })
      .eq("id", contact.id);
    return true;
  }

  if (!accessToken || !phoneNumberId) {
    console.error("terms_prompt_missing_meta_env");
    return false;
  }

  const body = buildTermsPromptBody();

  try {
    const { messageId } = await sendWhatsAppInteractiveButtons(accessToken, phoneNumberId, {
      to: waId,
      body,
      buttons: [
        { id: TERMS_BUTTON_ACCEPT, title: "Li e concordo" },
        { id: TERMS_BUTTON_DECLINE, title: "Não concordo" },
      ],
    });

    await persistOutboundCrmMessage(supabase, {
      waId,
      metaMessageId: messageId,
      messageType: "interactive",
      bodyText: body,
      content: { type: "terms_consent_prompt" },
      whatsappContactId: contact.id,
      isAutomated: true,
    });

    await supabase
      .from("whatsapp_contacts")
      .update({
        terms_prompt_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contact.id);

    console.info("terms_prompt_sent", { contactId: contact.id, waId });
    return true;
  } catch (error) {
    console.error("terms_prompt_send_failed", error);
    return false;
  }
}

export async function handleTermsConsentFlow(
  supabase: SupabaseClient,
  message: MetaWebhookMessage,
  contact: ContactConsentRow,
  waId: string,
): Promise<"handled" | "pending" | "continue"> {
  const consentReply = parseTermsConsentReply(message);

  if (consentReply) {
    await recordTermsConsentReply(supabase, contact.id, consentReply);
    console.info("terms_consent_reply", { contactId: contact.id, decision: consentReply });
    return "handled";
  }

  if (contact.terms_accepted_at) {
    return "continue";
  }

  if (!contact.terms_prompt_sent_at) {
    await sendTermsConsentPrompt(supabase, contact, waId);
    return "pending";
  }

  return "pending";
}
