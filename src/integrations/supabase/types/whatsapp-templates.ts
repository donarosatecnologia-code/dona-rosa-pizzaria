/** Tipos whatsapp_templates — alinhar com npm run db:types após migration. */

export type WhatsappTemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION";

export type WhatsappTemplateStatus = "draft" | "pending" | "approved" | "rejected" | "disabled";

export interface WhatsappTemplateVariable {
  index: number;
  example: string;
}

export interface WhatsappTemplate {
  id: string;
  name: string;
  display_name: string;
  category: WhatsappTemplateCategory;
  language: string;
  body: string;
  variables: WhatsappTemplateVariable[];
  meta_template_id: string | null;
  status: WhatsappTemplateStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  archived_at: string | null;
  is_meta_imported: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateSyncResult {
  ok: boolean;
  updated: number;
  imported?: number;
  total_meta: number;
  error?: string;
  message?: string;
}

export interface TemplateSubmitResult {
  ok: boolean;
  template_id: string;
  status: string;
}

/** Converte nome amigável para snake_case exigido pela Meta. */
export function toTemplateName(displayName: string): string {
  return displayName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 512) || "modelo";
}

export function extractVariablesFromBody(body: string): WhatsappTemplateVariable[] {
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

export function renderTemplatePreview(
  body: string,
  variables: WhatsappTemplateVariable[],
): string {
  let text = body;
  for (const variable of variables) {
    text = text.replaceAll(`{{${variable.index}}}`, variable.example);
  }
  return text;
}
