import { Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getServiceWindowExpiresAt, isServiceWindowOpen } from "@/integrations/supabase/types/whatsapp-inbox";

interface ServiceWindowBannerProps {
  lastInboundAt: string | null | undefined;
  isLoading?: boolean;
}

export function ServiceWindowBanner({ lastInboundAt, isLoading }: ServiceWindowBannerProps) {
  if (isLoading) {
    return null;
  }

  const open = isServiceWindowOpen(lastInboundAt);
  const expiresAt = getServiceWindowExpiresAt(lastInboundAt);

  if (open && expiresAt) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50 text-green-950">
        <Clock className="h-4 w-4" />
        <AlertTitle>Janela de atendimento aberta</AlertTitle>
        <AlertDescription>
          Você pode responder com texto livre até{" "}
          {expiresAt.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Janela de 24h encerrada</AlertTitle>
      <AlertDescription>
        Para falar com este contato, envie um modelo aprovado pela Meta.
      </AlertDescription>
    </Alert>
  );
}
