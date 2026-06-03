import { getMetaApiVersion } from "../_shared/meta-graph-api.ts";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";
import { AuthError, requireAdmin } from "../_shared/supabase-auth.ts";

console.info("whatsapp-phone-status started");

interface PhoneGraphFields {
  display_phone_number?: string;
  verified_name?: string;
  status?: string;
  platform_type?: string;
  is_on_biz_app?: boolean;
  error?: { message?: string; code?: number };
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) {
    return preflight;
  }

  if (req.method !== "GET") {
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

  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    return jsonWithCors({ error: "missing_meta_env" }, 500);
  }

  const apiVersion = getMetaApiVersion();
  const url =
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=display_phone_number,verified_name,status,platform_type,is_on_biz_app`;

  const graphRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = (await graphRes.json()) as PhoneGraphFields;

  if (!graphRes.ok || body.error) {
    return jsonWithCors({
      ok: false,
      error: "meta_graph_error",
      message: body.error?.message ?? "Não foi possível consultar o número na Meta.",
    }, 502);
  }

  const status = body.status ?? "UNKNOWN";
  const platformType = body.platform_type ?? "UNKNOWN";
  const isOnBizApp = Boolean(body.is_on_biz_app);
  const isCloudReady = status === "CONNECTED" && platformType === "CLOUD_API";
  const needsCoexistence = !isCloudReady && (status === "DISCONNECTED" || platformType === "ON_PREMISE");

  let user_hint = "Tudo certo com o número na API.";
  let next_step = "Envie uma mensagem de teste e confira em Mensagens.";

  if (needsCoexistence) {
    user_hint =
      "O celular da pizzaria ainda não está ligado à API. Use o botão abaixo e siga o passo a passo no popup e no WhatsApp Business.";
    next_step =
      "No popup: escolha o portfólio Dona Rosa Pizzaria (sua pizzaria), depois Conectar app WhatsApp Business e o número +55 11 93061-7116. No celular: abra a mensagem da Meta e toque em Conectar à plataforma comercial.";
  } else if (!isCloudReady) {
    user_hint = "Status incomum na Meta. Tente conectar de novo ou aguarde alguns minutos.";
    next_step = "Clique em Iniciar conexão novamente.";
  }

  return jsonWithCors({
    ok: true,
    phone: {
      display_phone_number: body.display_phone_number ?? null,
      verified_name: body.verified_name ?? null,
      status,
      platform_type: platformType,
      is_on_biz_app: isOnBizApp,
      is_cloud_ready: isCloudReady,
      needs_coexistence: needsCoexistence,
    },
    user_hint,
    next_step,
    checked_at: new Date().toISOString(),
  }, 200);
});
