import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  WhatsappContact,
  WhatsappContactUpdateInput,
} from "@/integrations/supabase/types/whatsapp-broadcast";
import { CONTACTS_KEY } from "./useWhatsappContacts";

export function useWhatsappContact(contactId: string | undefined) {
  return useQuery({
    queryKey: [...CONTACTS_KEY, "detail", contactId],
    enabled: Boolean(contactId),
    queryFn: async (): Promise<WhatsappContact> => {
      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .select("*")
        .eq("id", contactId!)
        .single();

      if (error) {
        throw error;
      }

      return data as WhatsappContact;
    },
  });
}

export function useEnsureConversationContact(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["whatsapp", "crm", "ensure-contact", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.rpc("ensure_whatsapp_conversation_contact", {
        p_conversation_id: conversationId!,
      });

      if (error) {
        throw error;
      }

      const contactId = data as string | null;
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm", "conversations"] });
      }

      return contactId;
    },
    staleTime: 30_000,
  });
}

export function useWhatsappContactByPhone(phoneNumber: string | undefined) {
  return useQuery({
    queryKey: [...CONTACTS_KEY, "by-phone", phoneNumber],
    enabled: Boolean(phoneNumber),
    queryFn: async (): Promise<WhatsappContact | null> => {
      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .select("*")
        .eq("phone_number", phoneNumber!)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data as WhatsappContact | null) ?? null;
    },
  });
}

export function useUpdateWhatsappContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      patch,
    }: {
      contactId: string;
      patch: WhatsappContactUpdateInput;
    }) => {
      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .update(patch)
        .eq("id", contactId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as WhatsappContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      queryClient.invalidateQueries({ queryKey: [...CONTACTS_KEY, "detail", data.id] });
    },
  });
}
