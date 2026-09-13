import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";
import {
  resolveCourseNotifyEmail,
  sendTransactionalEmail,
} from "../_shared/send-transactional-email.ts";

interface CourseRegistrationPayload {
  event?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  date?: string;
  time?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildCourseNotifyText(input: {
  eventType: string;
  name: string;
  phone: string;
  email: string | null;
  preferredDate: string;
  preferredTime: string;
}): string {
  return [
    "Nova inscrição — Dona Rosa Pizzaria",
    "",
    `Evento: ${input.eventType}`,
    `Nome: ${input.name}`,
    `Telefone: ${input.phone}`,
    `E-mail: ${input.email ?? "—"}`,
    `Data: ${input.preferredDate}`,
    `Horário: ${input.preferredTime}`,
    "",
    "Esta inscrição também foi salva no painel (course_registrations).",
    "Não responda por WhatsApp a este aviso automático.",
  ].join("\n");
}

function buildCourseNotifyHtml(input: {
  eventType: string;
  name: string;
  phone: string;
  email: string | null;
  preferredDate: string;
  preferredTime: string;
}): string {
  const rows = [
    ["Evento", input.eventType],
    ["Nome", input.name],
    ["Telefone", input.phone],
    ["E-mail", input.email ?? "—"],
    ["Data", input.preferredDate],
    ["Horário", input.preferredTime],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#666;">${escapeHtml(label)}</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:Georgia,serif;max-width:520px;color:#1a1a1a;">
      <h1 style="font-size:20px;margin:0 0 16px;">Nova inscrição — Dona Rosa Pizzaria</h1>
      <table style="border-collapse:collapse;font-size:15px;">${rows}</table>
      <p style="margin-top:20px;font-size:13px;color:#666;">
        Salva no painel administrativo. Este aviso não é enviado por WhatsApp.
      </p>
    </div>
  `;
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

  const notifyPayload = {
    eventType,
    name,
    phone,
    email,
    preferredDate,
    preferredTime,
  };

  const notifyTo = resolveCourseNotifyEmail();
  const emailResult = await sendTransactionalEmail({
    to: notifyTo,
    subject: `Nova inscrição: ${eventType} — ${name}`,
    text: buildCourseNotifyText(notifyPayload),
    html: buildCourseNotifyHtml(notifyPayload),
    replyTo: email,
  });

  if (!emailResult.ok) {
    console.warn("course_notify_email_not_sent", {
      to: notifyTo,
      error: emailResult.error,
      skipped: emailResult.skipped ?? false,
    });
  }

  return jsonWithCors({
    ok: true,
    contact_id: consentResult.contact_id,
    email_notified: emailResult.ok,
  }, 200);
});
