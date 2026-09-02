import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MessageCreatedPayload {
  conversation_id?: string;
  direction?: string;
}

/** Realtime CRM — canal admin:whatsapp:crm (message_created). */
export function useWhatsappCrmRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (channelRef.current?.state === "subscribed") {
      return;
    }

    const channel = supabase.channel("admin:whatsapp:crm", {
      config: { private: true },
    });

    channelRef.current = channel;

    void supabase.realtime.setAuth().then(() => {
      channel
        .on("broadcast", { event: "message_created" }, (event) => {
          const payload = event.payload as MessageCreatedPayload | undefined;
          queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
          if (payload?.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: ["whatsapp", "crm", "messages", payload.conversation_id],
            });
          }
        })
        .subscribe();
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, queryClient]);
}
