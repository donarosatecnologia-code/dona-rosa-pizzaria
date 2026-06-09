import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useQueueContactCount(queueId: string | null | undefined) {
  return useQuery({
    queryKey: ["whatsapp", "queue-contact-count", queueId],
    enabled: Boolean(queueId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resolve_queue_contact_ids", {
        p_queue_id: queueId!,
      });

      if (error) {
        throw error;
      }

      return (data ?? []).length;
    },
  });
}
