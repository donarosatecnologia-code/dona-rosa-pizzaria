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

  let graphRes: Response;
  let body: PhoneGraphFields;
  try {
    graphRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    body = (await graphRes.json()) as PhoneGraphFields;
  } catch (error) {
    console.error("phone_status_graph_fetch_failed", error);
    return jsonWithCors({
      ok: false,
      error: "meta_graph_unreachable",
      message: "Não foi possível falar com a Meta agora. Tente de novo em instantes.",
    }, 200);
  }

  if (!graphRes.ok || body.error) {
    const metaMessage = body.error?.message ?? "Não foi possível consultar o número na Meta.";
    const metaCode = body.error?.code;
    console.error("phone_status_graph_error", { metaCode, metaMessage });

    let user_hint =
      "O token do WhatsApp no servidor precisa ser atualizado.";
    let next_step =
      "Meta for Developers → WhatsApp → Configuração da API → gere um token novo → npm run secrets:meta";

    if (metaCode === 190 || metaMessage.includes("does not belong")) {
      user_hint =
        "Depois de mover o app de portfólio, o token antigo deixou de valer.";
      next_step =
        "Gere um token novo (API Setup ou Usuário do sistema no portfólio certo) e rode npm run secrets:meta no projeto.";
    }

    return jsonWithCors({
      ok: false,
      error: "meta_graph_error",
      message: metaMessage,
      meta_code: metaCode ?? null,
      user_hint,
      next_step,
    }, 200);
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
      "O celular da pizzaria ainda não está ligado à API Cloud (coexistência).";
    next_step =
      "No celular: WhatsApp Business → Conta → Plataforma comercial → Conectar. Não use verificação SMS no Gerenciador. Depois: Atualizar status no admin.";
  } else if (!isCloudReady) {
    user_hint = "Status incomum na Meta. Aguarde alguns minutos ou repita Plataforma comercial no celular.";
    next_step = "Consulte docs/COEXISTENCIA-WHATSAPP.md (passo 3).";
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
