/** Envio de e-mail transacional via Resend (Edge Functions). */

export interface TransactionalEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string | null;
}

export interface TransactionalEmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * Envia e-mail com Resend.
 * Requer secrets: RESEND_API_KEY, EMAIL_FROM (ex.: Dona Rosa <contato@donarosa.com.br>).
 */
export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
): Promise<TransactionalEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from =
    Deno.env.get("EMAIL_FROM")?.trim() ||
    Deno.env.get("RESEND_FROM_EMAIL")?.trim() ||
    "Dona Rosa Pizzaria <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("send_email_skipped", { reason: "missing_RESEND_API_KEY" });
    return { ok: false, skipped: true, error: "missing_RESEND_API_KEY" };
  }

  const payload: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    text: input.text,
  };

  if (input.html) {
    payload.html = input.html;
  }
  if (input.replyTo) {
    payload.reply_to = input.replyTo;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("send_email_failed", { status: response.status, body });
      return { ok: false, error: `resend_${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send_failed";
    console.error("send_email_exception", message);
    return { ok: false, error: message };
  }
}

export function resolveCourseNotifyEmail(): string {
  return (
    Deno.env.get("COURSE_NOTIFY_EMAIL")?.trim() ||
    Deno.env.get("ADMIN_NOTIFY_EMAIL")?.trim() ||
    "contato@donarosa.com.br"
  );
}
