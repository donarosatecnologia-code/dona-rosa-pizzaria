import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WhatsappContactStatus } from "@/integrations/supabase/types/whatsapp-broadcast";

interface ContactStatusBadgeProps {
  status: WhatsappContactStatus;
}

export function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  if (status === "opted_out") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-help">
              Parou de receber
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">
              Este cliente optou por não receber mensagens. Ele não será incluído em disparos.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <Badge variant="default">Ativo</Badge>;
}
