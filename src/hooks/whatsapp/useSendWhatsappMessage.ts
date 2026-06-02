import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionInvokeError } from "@/lib/readFunctionInvokeError";
import type { SendMessageResult } from "@/integrations/supabase/types/whatsapp-inbox";

export function useSendWhatsappMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      conversation_id: string;
      action: "text" | "template";
      body_text?: string;
      template_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke<SendMessageResult>(
        "whatsapp-send-message",
        { body: input },
      );

      if (error || !data?.ok) {
        throw new Error(await readFunctionInvokeError(error, data));
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
      queryClient.invalidateQueries({
        queryKey: ["whatsapp", "crm", "messages", variables.conversation_id],
      });
    },
  });
}

export function useCloseWhatsappConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
    },
  });
}

export function useServiceWindowOpen(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["whatsapp", "service-window", conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("is_whatsapp_service_window_open", {
        p_conversation_id: conversationId!,
      });
      if (error) {
        throw error;
      }
      return Boolean(data);
    },
    staleTime: 30_000,
  });
}
