import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsappQueue } from "@/integrations/supabase/types/whatsapp-broadcast";

export function useWhatsappQueues() {
  return useQuery({
    queryKey: ["whatsapp", "queues"],
    queryFn: async (): Promise<WhatsappQueue[]> => {
      const { data, error } = await supabase
        .from("whatsapp_queues")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappQueue[];
    },
  });
}
