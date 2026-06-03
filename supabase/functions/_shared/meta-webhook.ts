const encoder = new TextEncoder();

/** Comparação timing-safe de strings hex. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Valida X-Hub-Signature-256 (sha256=<hex>) contra o body bruto. */
export async function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expectedHex = signatureHeader.slice("sha256=".length);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(computedHex, expectedHex);
}

/** Normaliza telefone para dígitos E.164 (sem +). */
export function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export interface MetaWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { text: string; payload: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export interface MetaWebhookStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code?: number; title?: string; message?: string; error_data?: { details?: string } }>;
}

/** Mensagem enviada pelo app WhatsApp Business no celular (coexistência). */
export interface MetaWebhookMessageEcho {
  from: string;
  to: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { text: string; payload: string };
  interactive?: MetaWebhookMessage["interactive"];
}

export interface MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      field: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: MetaWebhookMessage[];
        message_echoes?: MetaWebhookMessageEcho[];
        statuses?: MetaWebhookStatus[];
      };
    }>;
  }>;
}

export function extractResponseValue(message: MetaWebhookMessage): string | null {
  if (message.type === "text" && message.text?.body?.trim()) {
    return message.text.body.trim();
  }
  if (message.type === "button" && message.button?.text?.trim()) {
    return message.button.text.trim();
  }
  if (message.type === "interactive") {
    const buttonReply = message.interactive?.button_reply?.title?.trim();
    if (buttonReply) {
      return buttonReply;
    }
    const listReply = message.interactive?.list_reply?.title?.trim();
    if (listReply) {
      return listReply;
    }
  }
  return null;
}

export function resolveResponseType(message: MetaWebhookMessage): string {
  if (message.type === "interactive" && message.interactive?.button_reply) {
    return "button";
  }
  if (message.type === "interactive" && message.interactive?.list_reply) {
    return "survey";
  }
  if (message.type === "button") {
    return "button";
  }
  if (message.type === "text") {
    return "reply";
  }
  return "other";
}
