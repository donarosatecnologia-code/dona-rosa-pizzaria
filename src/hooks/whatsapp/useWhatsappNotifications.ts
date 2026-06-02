import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsappAdminNotification } from "@/integrations/supabase/types/whatsapp-inbox";

const NOTIFICATIONS_KEY = ["whatsapp", "notifications"] as const;

export function useWhatsappNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async (): Promise<WhatsappAdminNotification[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data: notifications, error } = await supabase
        .from("whatsapp_admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const { data: reads } = await supabase
        .from("whatsapp_notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);

      const readSet = new Set((reads ?? []).map((r) => r.notification_id));

      return (notifications ?? []).map((n) => ({
        ...(n as WhatsappAdminNotification),
        is_read: readSet.has(n.id),
      }));
    },
    refetchInterval: 60_000,
  });
}

export function useWhatsappUnreadCount() {
  const { data: notifications } = useWhatsappNotifications();
  return notifications?.filter((n) => !n.is_read).length ?? 0;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      const { data, error } = await supabase.rpc("mark_whatsapp_notifications_read", {
        p_notification_ids: notificationIds ?? null,
      });
      if (error) {
        throw error;
      }
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useWhatsappNotificationsRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (channelRef.current?.state === "subscribed") {
      return;
    }

    const channel = supabase.channel("admin:whatsapp:notifications", {
      config: { private: true },
    });
    channelRef.current = channel;

    void supabase.realtime.setAuth().then(() => {
      channel
        .on("broadcast", { event: "notification_created" }, () => {
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
          queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
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
