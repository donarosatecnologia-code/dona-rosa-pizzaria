import { supabase } from "@/integrations/supabase/client";
import type {
  RegisterSiteConsentResult,
  WhatsappTermsSource,
} from "@/lib/whatsapp/registerSiteConsent";

export type { RegisterSiteConsentResult, WhatsappTermsSource };

/** Grava contato + aceite de termos quando o visitante confirma opt-in no site. */
export async function registerWhatsappSiteConsent(input: {
  name: string;
  phone: string;
  email?: string | null;
  source?: WhatsappTermsSource;
}): Promise<RegisterSiteConsentResult> {
  const { data, error } = await supabase.rpc("register_whatsapp_site_consent", {
    p_name: input.name.trim(),
    p_phone: input.phone.trim(),
    p_email: input.email?.trim() || null,
    p_source: input.source ?? "site_widget",
  });

  if (error) {
    throw error;
  }

  const result = data as RegisterSiteConsentResult;

  if (!result?.ok) {
    throw new Error(result?.error ?? "consent_failed");
  }

  return result;
}
