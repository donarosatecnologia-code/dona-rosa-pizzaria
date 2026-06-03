export const META_GRAPH_API_VERSION = "v21.0";

export const META_APP_ID =
  import.meta.env.VITE_META_APP_ID?.trim() || "912159588512848";

export const META_EMBEDDED_SIGNUP_CONFIG_ID =
  import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() || "";

/** ID do portfólio Meta Business (business.facebook.com/settings) — preenche o popup. */
export const META_BUSINESS_ID = import.meta.env.VITE_META_BUSINESS_ID?.trim() || "";

export const META_SDK_URL = "https://connect.facebook.net/pt_BR/sdk.js";

export type EmbeddedSignupEvent =
  | "FINISH"
  | "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"
  | "FINISH_ONLY_WABA"
  | "CANCEL"
  | "ERROR";

export interface EmbeddedSignupSessionData {
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
  current_step?: string;
  error_message?: string;
  error_code?: string;
}

export interface EmbeddedSignupMessage {
  type: "WA_EMBEDDED_SIGNUP";
  event: EmbeddedSignupEvent;
  data: EmbeddedSignupSessionData;
}

export interface EmbeddedSignupCompletePayload {
  code: string;
  event: EmbeddedSignupEvent;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
}

export function isEmbeddedSignupConfigured(): boolean {
  return Boolean(META_APP_ID && META_EMBEDDED_SIGNUP_CONFIG_ID);
}

/** Mensagens amigáveis para erros conhecidos do popup Meta (uso próprio, não parceiro). */
export function mapMetaSignupUserMessage(
  errorMessage?: string | null,
  errorCode?: string | null,
): string {
  const code = errorCode?.trim() ?? "";
  const msg = errorMessage?.trim() ?? "";

  if (
    msg.includes("pertence a este portfólio") ||
    msg.includes("owns Developer") ||
    msg.includes("cinza")
  ) {
    return [
      "A Meta não permite este popup quando o app e a pizzaria estão no mesmo portfólio.",
      "Não mova o app para outro portfólio (evita cobrança/pagamento duplicado).",
      "Use o passo principal: celular → WhatsApp Business → Conta → Plataforma comercial → Conectar.",
      "Antes: token do portfólio Dona Rosa em secrets + npm run secrets:meta e meta:coexistence.",
    ].join(" ");
  }

  if (code.includes("2655111") || msg.includes("2655111") || msg.includes("parceiro")) {
    return [
      "O popup entrou em modo parceiro. Para a Dona Rosa (uso próprio), ignore o popup.",
      "Siga: token no portfólio Dona Rosa → meta:coexistence → celular Plataforma comercial.",
      "Se precisar do popup no futuro: App Review ou app só em Desenvolvimento como administradora.",
    ].join(" ");
  }

  if (msg.includes("Instagram") || code.includes("1772090")) {
    return "A configuração do Facebook Login ainda pede Instagram. Remova esse ativo na configuração do app (modelo só WhatsApp 60 dias).";
  }

  if (msg) {
    return msg.length > 200 ? "Não foi possível conectar. Tente de novo ou fale com o suporte." : msg;
  }

  return "Conexão cancelada. Tente de novo quando estiver pronta.";
}

export function buildEmbeddedSignupExtras(): Record<string, unknown> {
  const setup: Record<string, unknown> = {};
  if (META_BUSINESS_ID) {
    setup.business = { id: META_BUSINESS_ID };
  }

  return {
    setup,
    featureType: "whatsapp_business_app_onboarding",
    sessionInfoVersion: "4",
  };
}
