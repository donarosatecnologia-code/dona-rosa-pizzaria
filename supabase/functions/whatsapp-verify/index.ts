import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { getMetaApiVersion } from "../_shared/meta-graph-api.ts";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Connection: "keep-alive",
};

console.info("whatsapp-verify started");

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const expectedSecret = Deno.env.get("META_VERIFY_TOKEN");
  const providedSecret = new URL(req.url).searchParams.get("secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID");
  const appSecret = Deno.env.get("META_APP_SECRET");

  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "missing_env", detail: "supabase" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRole);
  const checkedAt = new Date().toISOString();

  const envStatus = {
    meta_app_secret: Boolean(appSecret),
    meta_access_token: Boolean(accessToken),
    meta_phone_number_id: Boolean(phoneNumberId),
    meta_verify_token: Boolean(expectedSecret),
    meta_api_version: getMetaApiVersion(),
    broadcast_dry_run: Deno.env.get("BROADCAST_DRY_RUN") ?? "true",
  };

  let activeConfig: Record<string, unknown> | null = null;
  let lastWebhookAt: string | null = null;

  const { data: configRows } = await supabase
    .from("whatsapp_config")
    .select("phone_number_id, display_name, status, webhook_verified_at, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1);

  activeConfig = (configRows?.[0] as Record<string, unknown> | undefined) ?? null;

  const { data: lastEventRows } = await supabase
    .from("whatsapp_webhook_events")
    .select("created_at, processed, event_type")
    .order("created_at", { ascending: false })
    .limit(1);

  lastWebhookAt = (lastEventRows?.[0]?.created_at as string | undefined) ?? null;

  let metaStatus: {
    token_valid: boolean;
    display_phone_number: string | null;
    verified_name: string | null;
    status: string | null;
    platform_type: string | null;
    is_on_biz_app: boolean | null;
    is_cloud_ready: boolean;
    error: string | null;
  } = {
    token_valid: false,
    display_phone_number: null,
    verified_name: null,
    status: null,
    platform_type: null,
    is_on_biz_app: null,
    is_cloud_ready: false,
    error: null,
  };

  if (accessToken && phoneNumberId) {
    const apiVersion = getMetaApiVersion();
    const graphUrl =
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,status,platform_type,is_on_biz_app`;

    try {
      const graphRes = await fetch(graphUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const graphBody = await graphRes.json();

      if (graphRes.ok && graphBody.display_phone_number) {
        const status = (graphBody.status as string | undefined) ?? null;
        const platformType = (graphBody.platform_type as string | undefined) ?? null;
        metaStatus = {
          token_valid: true,
          display_phone_number: graphBody.display_phone_number as string,
          verified_name: (graphBody.verified_name as string | undefined) ?? null,
          status,
          platform_type: platformType,
          is_on_biz_app: (graphBody.is_on_biz_app as boolean | undefined) ?? null,
          is_cloud_ready: status === "CONNECTED" && platformType === "CLOUD_API",
          error: null,
        };
      } else {
        metaStatus.error =
          (graphBody.error?.message as string | undefined) ?? `graph_http_${graphRes.status}`;
      }
    } catch (error) {
      metaStatus.error = error instanceof Error ? error.message : "graph_request_failed";
    }
  } else {
    metaStatus.error = "missing_meta_credentials";
  }

  const webhookConfigured = Boolean(appSecret && expectedSecret);
  const hasDatabaseActivity = Boolean(activeConfig || lastWebhookAt);
  const ok = webhookConfigured && metaStatus.token_valid;

  return new Response(
    JSON.stringify({
      ok,
      checked_at: checkedAt,
      env: envStatus,
      webhook: {
        configured: webhookConfigured,
        url: `${supabaseUrl}/functions/v1/whatsapp-webhook`,
      },
      meta: metaStatus,
      database: {
        has_activity: hasDatabaseActivity,
        active_config: activeConfig,
        last_webhook_at: lastWebhookAt,
        last_event_type: (lastEventRows?.[0]?.event_type as string | undefined) ?? null,
      },
    }),
    { status: ok ? 200 : 503, headers: JSON_HEADERS },
  );
});
