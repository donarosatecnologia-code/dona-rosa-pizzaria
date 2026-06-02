import { Badge } from "@/components/ui/badge";
import type { WhatsappContactStatus } from "@/integrations/supabase/types/whatsapp-broadcast";

interface ContactStatusBadgeProps {
  status: WhatsappContactStatus;
}

export function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  if (status === "opted_out") {
    return <Badge variant="secondary">Parou de receber</Badge>;
  }
  return <Badge variant="default">Ativo</Badge>;
}
