export interface WebhookChangeContext {
  field: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  rawValue: Record<string, unknown>;
}

/** Hash curto e determinístico para payloads sem identificadores Meta explícitos. */
function stablePayloadFingerprint(raw: Record<string, unknown>): string {
  const normalized = JSON.stringify(raw, Object.keys(raw).sort());
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Chave idempotente por change do webhook Meta (dr-fase1). */
export function buildWebhookDedupeKey(ctx: WebhookChangeContext): string {
  const value = ctx.rawValue;
  const parts: string[] = [ctx.field, ctx.phoneNumberId ?? ""];

  const messages = (value.messages as Array<{ id?: string }> | undefined) ?? [];
  const messageIds = messages
    .map((message) => message.id?.trim())
    .filter((id): id is string => Boolean(id))
    .sort();

  if (messageIds.length > 0) {
    parts.push(`msg:${messageIds.join(",")}`);
  }

  const statuses =
    (value.statuses as Array<{ id?: string; status?: string }> | undefined) ?? [];
  const statusKeys = statuses
    .map((status) => {
      const id = status.id?.trim();
      const state = status.status?.trim();
      if (!id || !state) {
        return null;
      }
      return `${id}:${state}`;
    })
    .filter((key): key is string => Boolean(key))
    .sort();

  if (statusKeys.length > 0) {
    parts.push(`st:${statusKeys.join(",")}`);
  }

  if (ctx.field === "message_template_status_update") {
    const templateId =
      value.message_template_id != null ? String(value.message_template_id) : "";
    const event = typeof value.event === "string" ? value.event : "";
    parts.push(`tpl:${templateId}:${event}`);
  }

  if (parts.length === 2) {
    parts.push(`raw:${stablePayloadFingerprint(value)}`);
  }

  return parts.join("|");
}
