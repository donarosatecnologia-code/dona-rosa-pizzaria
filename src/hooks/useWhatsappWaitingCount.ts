import { useMemo } from "react";
import { useWhatsappConversations } from "@/hooks/whatsapp/useWhatsappConversations";
import { isWaitingForReply } from "@/integrations/supabase/types/whatsapp-inbox";

export function useWhatsappWaitingCount(): number {
  const { data: conversations } = useWhatsappConversations();

  return useMemo(
    () => conversations?.filter(isWaitingForReply).length ?? 0,
    [conversations],
  );
}
