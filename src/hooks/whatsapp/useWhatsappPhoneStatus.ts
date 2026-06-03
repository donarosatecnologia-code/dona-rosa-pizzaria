import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsappPhoneStatus {
  display_phone_number: string | null;
  verified_name: string | null;
  status: string;
  platform_type: string;
  is_on_biz_app: boolean;
  is_cloud_ready: boolean;
  needs_coexistence: boolean;
}

export interface WhatsappPhoneStatusResponse {
  ok: boolean;
  phone?: WhatsappPhoneStatus;
  user_hint?: string;
  next_step?: string;
  message?: string;
}

/** Status Cloud API / coexistência (consulta Graph API via Edge Function). */
export function useWhatsappPhoneStatus(enabled = true) {
  return useQuery({
    queryKey: ["whatsapp", "phone-status"],
    enabled,
    queryFn: async (): Promise<WhatsappPhoneStatusResponse> => {
      const { data, error } = await supabase.functions.invoke<WhatsappPhoneStatusResponse>(
        "whatsapp-phone-status",
        { method: "GET" },
      );

      if (data) {
        return data;
      }

      if (error) {
        return {
          ok: false,
          message: error.message || "Não foi possível verificar o número.",
        };
      }

      return { ok: false, message: "Resposta vazia." };
    },
    staleTime: 15_000,
    retry: 1,
    refetchInterval: (query) => {
      if (query.state.error || query.state.data?.ok === false) {
        return false;
      }
      const ready = query.state.data?.phone?.is_cloud_ready;
      return ready ? false : 30_000;
    },
  });
}
