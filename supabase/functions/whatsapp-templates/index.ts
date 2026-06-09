import {
  createMetaMessageTemplate,
  extractBodyFromMetaComponents,
  listMetaMessageTemplates,
  mapMetaStatusToLocal,
  MetaApiError,
  resolveWabaId,
} from "../_shared/meta-graph-api.ts";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";
import { AuthError, createServiceClient, requireAdmin } from "../_shared/supabase-auth.ts";

console.info("whatsapp-templates started");

interface TemplatesRequest {
  action?: "submit" | "sync";
  template_id?: string;
}

interface TemplateRow {
  id: string;
  name: string;
  display_name: string;
  category: string;
  language: string;
  body: string;
  variables: Array<{ index: number; example: string }>;
  status: string;
  meta_template_id: string | null;
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

  let body: TemplatesRequest;
  try {
    body = (await req.json()) as TemplatesRequest;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    return jsonResponse({ error: "missing_meta_env" }, 500);
  }

  try {
    if (body.action === "submit") {
      return await handleSubmit(body.template_id, accessToken, phoneNumberId);
    }
    if (body.action === "sync") {
      return await handleSync(accessToken, phoneNumberId, body.template_id);
    }
    return jsonResponse({ error: "unknown_action" }, 400);
  } catch (error) {
    if (error instanceof MetaApiError) {
      const errorCode = error.message.includes("App Review") ||
          error.message.includes("coexistência")
        ? "meta_template_permission_denied"
        : "meta_api_error";
      return jsonResponse(
        { ok: false, error: errorCode, message: error.message },
        error.status >= 400 && error.status < 600 ? error.status : 502,
      );
    }
    console.error("whatsapp_templates_error", error);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});

async function handleSubmit(
  templateId: string | undefined,
  accessToken: string,
  phoneNumberId: string,
): Promise<Response> {
  if (!templateId?.trim()) {
    return jsonResponse({ error: "template_id_required" }, 400);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (error || !data) {
    return jsonResponse({ error: "template_not_found" }, 404);
  }

  const row = data as TemplateRow;
  if (row.status !== "draft" && row.status !== "rejected") {
    return jsonResponse({
      ok: false,
      error: "template_not_submittable",
      message: "Só é possível enviar rascunhos ou modelos reprovados.",
    }, 400);
  }

  const wabaId = await resolveWabaId(accessToken, phoneNumberId);
  const variables = Array.isArray(row.variables) ? row.variables : [];

  const result = await createMetaMessageTemplate(accessToken, wabaId, {
    name: row.name,
    language: row.language,
    category: row.category,
    body: row.body,
    variables,
  });

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("whatsapp_templates")
    .update({
      meta_template_id: result.metaTemplateId,
      status: result.status,
      submitted_at: now,
      updated_at: now,
      rejection_reason: null,
      approved_at: result.status === "approved" ? now : null,
    })
    .eq("id", row.id);

  if (updateError) {
    throw updateError;
  }

  return jsonResponse({ ok: true, template_id: row.id, status: result.status }, 200);
}

async function handleSync(
  accessToken: string,
  phoneNumberId: string,
  templateId?: string,
): Promise<Response> {
  const supabase = createServiceClient();
  const wabaId = await resolveWabaId(accessToken, phoneNumberId);
  const metaTemplates = await listMetaMessageTemplates(accessToken, wabaId);

  let query = supabase.from("whatsapp_templates").select("*");
  if (templateId?.trim()) {
    query = query.eq("id", templateId);
  }

  const { data: localRows, error } = await query;
  if (error) {
    throw error;
  }

  let updated = 0;
  const now = new Date().toISOString();

  for (const local of (localRows ?? []) as TemplateRow[]) {
    const match = metaTemplates.find(
      (m) =>
        (local.meta_template_id && m.id === local.meta_template_id) ||
        (m.name === local.name && m.language === local.language),
    );

    if (!match) {
      continue;
    }

    const status = mapMetaStatusToLocal(match.status);
    const rejectedReason = match.rejected_reason;
    const patch: Record<string, unknown> = {
      status,
      meta_template_id: match.id ?? local.meta_template_id,
      updated_at: now,
      rejection_reason:
        rejectedReason && rejectedReason !== "NONE" ? rejectedReason : null,
    };

    if (status === "approved") {
      patch.approved_at = now;
    }

    const { error: updateError } = await supabase
      .from("whatsapp_templates")
      .update(patch)
      .eq("id", local.id);

    if (!updateError) {
      updated += 1;
    }
  }

  let imported = 0;
  if ((localRows ?? []).length === 0 && metaTemplates.length > 0) {
    imported = await importApprovedFromMeta(supabase, metaTemplates, now);
  }

  return jsonResponse({ ok: true, updated, imported, total_meta: metaTemplates.length }, 200);
}

async function importApprovedFromMeta(
  supabase: ReturnType<typeof createServiceClient>,
  metaTemplates: Awaited<ReturnType<typeof listMetaMessageTemplates>>,
  now: string,
): Promise<number> {
  let imported = 0;
  const approved = metaTemplates.filter((m) => m.status === "APPROVED" && m.name);

  for (const meta of approved.slice(0, 30)) {
    const body = extractBodyFromMetaComponents(meta.components);
    const { error } = await supabase.from("whatsapp_templates").upsert(
      {
        name: meta.name!,
        display_name: meta.name!.replace(/_/g, " "),
        category: meta.category ?? "UTILITY",
        language: meta.language ?? "pt_BR",
        body: body || meta.name!,
        variables: [],
        meta_template_id: meta.id ?? null,
        status: "approved",
        approved_at: now,
        updated_at: now,
        is_meta_imported: true,
      },
      { onConflict: "name,language", ignoreDuplicates: false },
    );

    if (!error) {
      imported += 1;
    }
  }

  return imported;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return jsonWithCors(body, status);
}
