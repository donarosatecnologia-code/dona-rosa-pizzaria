import { supabase } from "@/integrations/supabase/client";
import type { WhatsappTermsSource } from "@/integrations/supabase/types/whatsapp-broadcast";

export interface RegisterSiteConsentResult {
  ok: boolean;
  contact_id?: string;
  phone_number?: string;
  terms_accepted?: boolean;
  error?: string;
}

export type { WhatsappTermsSource };

/** Grava contato + aceite de termos quando o visitante confirma opt-in no site. */
export async function registerWhatsappSiteConsent(input: {
  name: string;
  phone: string;
  email?: string | null;
  source?: WhatsappTermsSource;
}): Promise<RegisterSiteConsentResult> {
  const { data, error } = await supabase.functions.invoke<RegisterSiteConsentResult>(
    "register-site-consent",
    {
      body: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        source: input.source ?? "site_widget",
      },
    },
  );

  if (error) {
    throw error;
  }

  if (!data?.ok) {
    throw new Error(data?.error ?? "consent_failed");
  }

  return data;
}
