import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BroadcastSendResult {
  ok: boolean;
  campaign_id: string;
  dry_run?: boolean;
  sent: number;
  failed: number;
  pending_remaining: number;
  status: string;
  error?: string;
}

export function useBroadcastSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { campaign_id: string; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke<BroadcastSendResult>(
        "broadcast-send",
        { body: input },
      );

      if (error) {
        throw error;
      }

      if (!data?.ok) {
        throw new Error(data?.error ?? "broadcast_send_failed");
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "campaigns"] });
      queryClient.invalidateQueries({
        queryKey: ["whatsapp", "campaign-recipients", variables.campaign_id],
      });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
    },
  });
}
