import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Realtime via broadcast trigger (canal admin:whatsapp:broadcasts). */
export function useWhatsappBroadcastRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (channelRef.current?.state === "subscribed") {
      return;
    }

    const channel = supabase.channel("admin:whatsapp:broadcasts", {
      config: { private: true },
    });

    channelRef.current = channel;

    void supabase.realtime.setAuth().then(() => {
      channel
        .on("broadcast", { event: "survey_response_received" }, () => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp", "responses"] });
          queryClient.invalidateQueries({ queryKey: ["whatsapp", "campaigns"] });
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
