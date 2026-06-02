import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";

const CONTACTS_KEY = ["whatsapp", "contacts"] as const;

export function useWhatsappContacts() {
  return useQuery({
    queryKey: CONTACTS_KEY,
    queryFn: async (): Promise<WhatsappContact[]> => {
      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .select("*")
        .order("last_inbound_at", { ascending: false, nullsFirst: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappContact[];
    },
  });
}

export function useCreateWhatsappContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; phone_number: string }) => {
      const phone = input.phone_number.replace(/\D/g, "");
      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .insert({
          name: input.name.trim(),
          phone_number: phone,
          status: "active",
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as WhatsappContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}
