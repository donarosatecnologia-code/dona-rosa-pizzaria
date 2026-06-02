const DEFAULT_API_VERSION = "v21.0";

export class MetaApiError extends Error {
  status: number;
  metaCode?: number;
  metaType?: string;

  constructor(message: string, status: number, meta?: { code?: number; type?: string }) {
    super(message);
    this.status = status;
    this.metaCode = meta?.code;
    this.metaType = meta?.type;
  }
}

export function getMetaApiVersion(): string {
  return Deno.env.get("META_API_VERSION") ?? DEFAULT_API_VERSION;
}

export interface TemplateSendOptions {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: unknown[];
}

interface GraphMessagesResponse {
  messages?: Array<{ id: string }>;
  error?: { message: string; code?: number; type?: string };
}

/** Monta language + components a partir de template_params (jsonb da campanha). */
export function parseTemplateParams(
  params: Record<string, unknown> | null | undefined,
): { languageCode: string; components?: unknown[] } {
  if (!params) {
    return { languageCode: "en_US" };
  }

  const languageCode =
    typeof params.language === "string" ? params.language : "pt_BR";

  if (Array.isArray(params.components)) {
    return { languageCode, components: params.components };
  }

  if (Array.isArray(params.body)) {
    return {
      languageCode,
      components: [
        {
          type: "body",
          parameters: (params.body as string[]).map((text) => ({
            type: "text",
            text,
          })),
        },
      ],
    };
  }

  return { languageCode };
}

/** Envia template aprovado via Graph API. */
export async function sendWhatsAppTemplate(
  accessToken: string,
  phoneNumberId: string,
  options: TemplateSendOptions,
): Promise<{ messageId: string }> {
  const apiVersion = getMetaApiVersion();
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const template: Record<string, unknown> = {
    name: options.templateName,
    language: { code: options.languageCode ?? "pt_BR" },
  };

  if (options.components?.length) {
    template.components = options.components;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: options.to.replace(/\D/g, ""),
      type: "template",
      template,
    }),
  });

  const data = (await response.json()) as GraphMessagesResponse;

  if (!response.ok || !data.messages?.[0]?.id) {
    const message = data.error?.message ?? "meta_send_failed";
    throw new MetaApiError(message, response.status, {
      code: data.error?.code,
      type: data.error?.type,
    });
  }

  return { messageId: data.messages[0].id };
}

export interface TextSendOptions {
  to: string;
  body: string;
}

/** Envia mensagem de texto livre (janela 24h). */
export async function sendWhatsAppText(
  accessToken: string,
  phoneNumberId: string,
  options: TextSendOptions,
): Promise<{ messageId: string }> {
  const apiVersion = getMetaApiVersion();
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: options.to.replace(/\D/g, ""),
      type: "text",
      text: { body: options.body },
    }),
  });

  const data = (await response.json()) as GraphMessagesResponse;

  if (!response.ok || !data.messages?.[0]?.id) {
    const message = data.error?.message ?? "meta_text_send_failed";
    throw new MetaApiError(message, response.status, {
      code: data.error?.code,
      type: data.error?.type,
    });
  }

  return { messageId: data.messages[0].id };
}

export type MetaTemplateStatus = "APPROVED" | "PENDING" | "REJECTED" | "PAUSED" | "DISABLED" | "IN_APPEAL";

export interface MetaTemplateVariable {
  index: number;
  example: string;
}

export interface MetaTemplateRecord {
  id: string;
  name: string;
  display_name: string;
  category: string;
  language: string;
  body: string;
  variables: MetaTemplateVariable[];
  meta_template_id: string | null;
  status: string;
  rejection_reason: string | null;
}

interface GraphErrorBody {
  error?: { message: string; code?: number; type?: string };
}

interface WabaResponse {
  health_status?: {
    entities?: Array<{ entity_type?: string; id?: string }>;
  };
  error?: { message: string; code?: number; type?: string };
}

interface CreateTemplateResponse extends GraphErrorBody {
  id?: string;
  status?: string;
  category?: string;
}

interface MetaTemplateListItem {
  id?: string;
  name?: string;
  status?: MetaTemplateStatus;
  language?: string;
  category?: string;
  rejected_reason?: string;
  components?: Array<{ type?: string; text?: string }>;
}

interface ListTemplatesResponse extends GraphErrorBody {
  data?: MetaTemplateListItem[];
}

export function mapMetaStatusToLocal(status: string | undefined): string {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "approved";
    case "PENDING":
    case "IN_APPEAL":
      return "pending";
    case "REJECTED":
      return "rejected";
    case "PAUSED":
    case "DISABLED":
      return "disabled";
    default:
      return "pending";
  }
}

export function extractVariablesFromBody(body: string): MetaTemplateVariable[] {
  const matches = body.matchAll(/\{\{(\d+)\}\}/g);
  const indexes = new Set<number>();
  for (const match of matches) {
    indexes.add(Number(match[1]));
  }
  return [...indexes].sort((a, b) => a - b).map((index) => ({
    index,
    example: index === 1 ? "Maria" : `exemplo${index}`,
  }));
}

/** Resolve WABA ID via META_WABA_ID ou health_status do phone_number_id. */
export async function resolveWabaId(
  accessToken: string,
  phoneNumberId: string,
): Promise<string> {
  const fromEnv = Deno.env.get("META_WABA_ID")?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const apiVersion = getMetaApiVersion();
  const url =
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=health_status`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json()) as WabaResponse;

  const wabaId = data.health_status?.entities?.find(
    (entity) => entity.entity_type === "WABA" && entity.id,
  )?.id;

  if (!response.ok || !wabaId) {
    const message = data.error?.message ??
      "waba_id_not_found — defina META_WABA_ID em supabase/secrets.meta.env (WhatsApp → API Setup)";
    throw new MetaApiError(message, response.status || 400, {
      code: data.error?.code,
      type: data.error?.type,
    });
  }

  return wabaId;
}

/** Submete template para aprovação na Meta. */
export async function createMetaMessageTemplate(
  accessToken: string,
  wabaId: string,
  input: {
    name: string;
    language: string;
    category: string;
    body: string;
    variables: MetaTemplateVariable[];
  },
): Promise<{ metaTemplateId: string; status: string }> {
  const apiVersion = getMetaApiVersion();
  const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`;

  const bodyComponent: Record<string, unknown> = {
    type: "BODY",
    text: input.body,
  };

  if (input.variables.length > 0) {
    bodyComponent.example = {
      body_text: [input.variables.sort((a, b) => a.index - b.index).map((v) => v.example)],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      language: input.language,
      category: input.category,
      components: [bodyComponent],
    }),
  });

  const data = (await response.json()) as CreateTemplateResponse;

  if (!response.ok || !data.id) {
    const message = data.error?.message ?? "meta_template_create_failed";
    throw new MetaApiError(message, response.status, {
      code: data.error?.code,
      type: data.error?.type,
    });
  }

  return {
    metaTemplateId: data.id,
    status: mapMetaStatusToLocal(data.status ?? "PENDING"),
  };
}

/** Lista templates da conta Meta (para sincronizar status). */
export async function listMetaMessageTemplates(
  accessToken: string,
  wabaId: string,
): Promise<MetaTemplateListItem[]> {
  const apiVersion = getMetaApiVersion();
  const fields = "id,name,status,language,category,rejected_reason,components";
  const url =
    `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates?limit=100&fields=${fields}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json()) as ListTemplatesResponse;

  if (!response.ok) {
    const message = data.error?.message ?? "meta_template_list_failed";
    throw new MetaApiError(message, response.status, {
      code: data.error?.code,
      type: data.error?.type,
    });
  }

  return data.data ?? [];
}

export function extractBodyFromMetaComponents(
  components?: Array<{ type?: string; text?: string }>,
): string {
  const body = components?.find((c) => c.type === "BODY" || c.type === "body");
  return body?.text ?? "";
}
