import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";

interface ConsentPayload {
  name?: string;
  phone?: string;
  email?: string | null;
  source?: string;
}

const ALLOWED_SOURCES = new Set(["site_widget", "site_contact_form", "site_reserve"]);

Deno.serve(async (req: Request) => {
  const cors = handleCorsPreflight(req);
  if (cors) {
    return cors;
  }

  if (req.method !== "POST") {
    return jsonWithCors({ ok: false, error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRole) {
    return jsonWithCors({ ok: false, error: "missing_env" }, 500);
  }

  let body: ConsentPayload;
  try {
    body = (await req.json()) as ConsentPayload;
  } catch {
    return jsonWithCors({ ok: false, error: "invalid_json" }, 400);
  }

  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const email = body.email?.trim() || null;
  const source = body.source?.trim() || "site_widget";

  if (!name) {
    return jsonWithCors({ ok: false, error: "name_required" }, 400);
  }

  if (!phone) {
    return jsonWithCors({ ok: false, error: "phone_required" }, 400);
  }

  if (!ALLOWED_SOURCES.has(source)) {
    return jsonWithCors({ ok: false, error: "invalid_source" }, 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRole);

  const { data, error } = await serviceClient.schema("private").rpc("register_whatsapp_site_consent", {
    p_name: name,
    p_phone: phone,
    p_email: email,
    p_source: source,
  });

  if (error) {
    console.error("register-site-consent rpc error:", error.message);
    return jsonWithCors({ ok: false, error: "consent_failed" }, 500);
  }

  const result = data as { ok?: boolean; error?: string };

  if (!result?.ok) {
    return jsonWithCors(
      { ok: false, error: result?.error ?? "consent_failed" },
      result?.error === "invalid_phone" || result?.error === "name_required" ? 400 : 422,
    );
  }

  return jsonWithCors(result as Record<string, unknown>, 200);
});
