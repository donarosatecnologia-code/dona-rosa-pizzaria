import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsappImportBatch } from "@/integrations/supabase/types/whatsapp-broadcast";

const BATCHES_KEY = ["whatsapp", "import-batches"] as const;

export function useWhatsappImportBatches(limit = 5) {
  return useQuery({
    queryKey: [...BATCHES_KEY, limit],
    queryFn: async (): Promise<WhatsappImportBatch[]> => {
      const { data, error } = await supabase
        .from("whatsapp_import_batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappImportBatch[];
    },
  });
}
