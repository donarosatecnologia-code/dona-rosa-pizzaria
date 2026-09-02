import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";

interface CourseRegistrationPayload {
  event?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  date?: string;
  time?: string;
}

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

  let body: CourseRegistrationPayload;
  try {
    body = (await req.json()) as CourseRegistrationPayload;
  } catch {
    return jsonWithCors({ ok: false, error: "invalid_json" }, 400);
  }

  const eventType = body.event?.trim() ?? "";
  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const email = body.email?.trim() || null;
  const preferredDate = body.date?.trim() ?? "";
  const preferredTime = body.time?.trim() ?? "";

  if (!eventType || !name || !phone || !preferredDate || !preferredTime) {
    return jsonWithCors({ ok: false, error: "missing_fields" }, 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRole);

  const { data: consent, error: consentError } = await serviceClient.schema("private").rpc(
    "register_whatsapp_site_consent",
    {
      p_name: name,
      p_phone: phone,
      p_email: email,
      p_source: "site_course",
    },
  );

  if (consentError) {
    console.error("register-course-inscription consent error:", consentError.message);
    return jsonWithCors({ ok: false, error: "consent_failed" }, 500);
  }

  const consentResult = consent as { ok?: boolean; contact_id?: string; error?: string };
  if (!consentResult?.ok) {
    return jsonWithCors(
      { ok: false, error: consentResult?.error ?? "consent_failed" },
      400,
    );
  }

  const { error: insertError } = await serviceClient.from("course_registrations").insert({
    contact_id: consentResult.contact_id ?? null,
    event_type: eventType,
    name,
    phone,
    email,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
  });

  if (insertError) {
    console.error("register-course-inscription insert error:", insertError.message);
    return jsonWithCors({ ok: false, error: "registration_failed" }, 500);
  }

  return jsonWithCors({
    ok: true,
    contact_id: consentResult.contact_id,
  }, 200);
});
