import { getMetaApiVersion } from "../_shared/meta-graph-api.ts";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";
import { AuthError, createServiceClient, requireAdmin } from "../_shared/supabase-auth.ts";

console.info("whatsapp-embedded-signup started");

interface CompleteSignupRequest {
  code?: string;
  event?: string;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) {
    return preflight;
  }

  if (req.method !== "POST") {
    return jsonWithCors({ error: "method_not_allowed" }, 405);
  }

  try {
    await requireAdmin(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonWithCors({ error: error.code }, error.status);
    }
    throw error;
  }

  let body: CompleteSignupRequest;
  try {
    body = (await req.json()) as CompleteSignupRequest;
  } catch {
    return jsonWithCors({ error: "invalid_json" }, 400);
  }

  const code = body.code?.trim();
  if (!code) {
    return jsonWithCors({ error: "code_required" }, 400);
  }

  const appId = Deno.env.get("META_APP_ID") ?? "912159588512848";
  const appSecret = Deno.env.get("META_APP_SECRET");
  const verifyToken = Deno.env.get("META_VERIFY_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!appSecret || !verifyToken || !supabaseUrl) {
    return jsonWithCors({ error: "missing_meta_env" }, 500);
  }

  const apiVersion = getMetaApiVersion();
  const wabaId = body.waba_id?.trim() ?? Deno.env.get("META_WABA_ID") ?? "";
  const phoneNumberId =
    body.phone_number_id?.trim() ?? Deno.env.get("META_PHONE_NUMBER_ID") ?? "";

  const tokenUrl = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenBody = await tokenRes.json();

  if (!tokenRes.ok || !tokenBody.access_token) {
    console.error("embedded_signup_token_exchange_failed", tokenBody);
    return jsonWithCors(
      {
        error: "token_exchange_failed",
        detail: tokenBody.error?.message ?? "Falha ao trocar código OAuth",
      },
      502,
    );
  }

  const businessToken = tokenBody.access_token as string;
  const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

  if (wabaId) {
    const subscribeUrl = new URL(
      `https://graph.facebook.com/${apiVersion}/${wabaId}/subscribed_apps`,
    );
    subscribeUrl.searchParams.set("override_callback_uri", webhookUrl);
    subscribeUrl.searchParams.set("verify_token", verifyToken);

    const subscribeRes = await fetch(subscribeUrl.toString(), {
      method: "POST",
      headers: { Authorization: `Bearer ${businessToken}` },
    });
    const subscribeBody = await subscribeRes.json();

    if (!subscribeRes.ok && !subscribeBody.success) {
      console.error("embedded_signup_subscribe_failed", subscribeBody);
      return jsonWithCors(
        {
          error: "waba_subscribe_failed",
          detail: subscribeBody.error?.message ?? "Falha ao inscrever app na WABA",
        },
        502,
      );
    }
  }

  if (phoneNumberId) {
    const registerRes = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${businessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp" }),
      },
    );
    const registerBody = await registerRes.json();

    if (!registerRes.ok) {
      const errorCode = registerBody.error?.code;
      if (errorCode !== 133005 && errorCode !== 100) {
        console.warn("embedded_signup_register_skipped", registerBody);
      }
    }
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  if (phoneNumberId) {
    await supabase.rpc("upsert_whatsapp_config_active", {
      p_phone_number_id: phoneNumberId,
      p_display_name: null,
    });

    await supabase
      .from("whatsapp_config")
      .update({ webhook_verified_at: now, updated_at: now })
      .eq("phone_number_id", phoneNumberId);
  }

  console.info("embedded_signup_complete", {
    event: body.event,
    wabaId,
    phoneNumberId,
  });

  return jsonWithCors({
    ok: true,
    waba_id: wabaId || undefined,
    phone_number_id: phoneNumberId || undefined,
    message: "WhatsApp conectado. Peça para enviar uma mensagem de teste.",
  });
});
