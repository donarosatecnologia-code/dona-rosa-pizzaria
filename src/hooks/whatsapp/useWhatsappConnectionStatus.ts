import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsappConfig } from "@/integrations/supabase/types/whatsapp-crm";

export interface WhatsappConnectionStatus {
  isConnected: boolean;
  config: WhatsappConfig | null;
  lastWebhookAt: string | null;
}

/** Status da conexão Meta ↔ Supabase (dr-fase1). */
export function useWhatsappConnectionStatus() {
  const query = useQuery({
    queryKey: ["whatsapp", "connection-status"],
    queryFn: async (): Promise<WhatsappConnectionStatus> => {
      const { data: configRows, error: configError } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (configError) {
        throw configError;
      }

      const config = (configRows?.[0] as WhatsappConfig | undefined) ?? null;

      const { data: lastEventRows, error: eventError } = await supabase
        .from("whatsapp_webhook_events")
        .select("created_at, processed")
        .order("created_at", { ascending: false })
        .limit(1);

      if (eventError) {
        throw eventError;
      }

      const lastWebhookAt = (lastEventRows?.[0]?.created_at as string | undefined) ?? null;
      const isConnected = Boolean(config?.webhook_verified_at) || Boolean(lastWebhookAt);

      return { isConnected, config, lastWebhookAt };
    },
    staleTime: 30_000,
  });

  return {
    ...query,
    isLoading: query.isPending,
    isConnected: query.data?.isConnected ?? false,
    config: query.data?.config ?? null,
    lastWebhookAt: query.data?.lastWebhookAt ?? null,
  };
}
