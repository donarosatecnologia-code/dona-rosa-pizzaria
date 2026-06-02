import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  WhatsappConversationWithPreview,
  WhatsappMessage,
} from "@/integrations/supabase/types/whatsapp-crm";

const CONVERSATIONS_KEY = ["whatsapp", "crm", "conversations"] as const;

export function useWhatsappConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async (): Promise<WhatsappConversationWithPreview[]> => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select(
          "*, whatsapp_messages(id, body_text, direction, created_at, status)",
        )
        .is("deleted_at", null)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappConversationWithPreview[];
    },
  });
}

export function useWhatsappMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["whatsapp", "crm", "messages", conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<WhatsappMessage[]> => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappMessage[];
    },
  });
}

export function useWhatsappWebhookEvents(limit = 20) {
  return useQuery({
    queryKey: ["whatsapp", "crm", "webhook-events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_webhook_events")
        .select("id, event_type, phone_number_id, processed, processing_error, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}
