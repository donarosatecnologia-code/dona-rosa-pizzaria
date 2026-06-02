import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsappContactStatus } from "@/integrations/supabase/types/whatsapp-broadcast";

export function useUpdateWhatsappContactStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { contactId: string; status: WhatsappContactStatus }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("whatsapp_contacts")
        .update({
          status: input.status,
          opted_out_at: input.status === "opted_out" ? now : null,
          updated_at: now,
        })
        .eq("id", input.contactId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contacts"] });
    },
  });
}
