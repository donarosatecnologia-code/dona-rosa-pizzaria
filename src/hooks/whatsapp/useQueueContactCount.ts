import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";

export function useQueueContactCount(queueId: string | null | undefined) {
  return useQuery({
    queryKey: ["whatsapp", "queue-contact-count", queueId],
    enabled: Boolean(queueId),
    queryFn: async () => {
      const ids = await fetchAllRows<string>((from, to) =>
        supabase
          .rpc("resolve_queue_contact_ids", {
            p_queue_id: queueId!,
          })
          .range(from, to),
      );

      return ids.length;
    },
  });
}
