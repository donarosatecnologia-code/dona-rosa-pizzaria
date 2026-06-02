export const META_GRAPH_API_VERSION = "v21.0";

export const META_APP_ID =
  import.meta.env.VITE_META_APP_ID?.trim() || "912159588512848";

export const META_EMBEDDED_SIGNUP_CONFIG_ID =
  import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() || "";

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
