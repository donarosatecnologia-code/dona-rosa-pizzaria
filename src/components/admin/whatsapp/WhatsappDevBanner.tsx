import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useWhatsappConnectionStatus } from "@/hooks/whatsapp";
import { cn } from "@/lib/utils";

interface WhatsappDevBannerProps {
  compact?: boolean;
}

export function WhatsappDevBanner({ compact = false }: WhatsappDevBannerProps) {
  const { data } = useWhatsappConnectionStatus();

  return (
    <Alert
      className={cn(
        "border-amber-200 bg-amber-50 text-amber-950",
        compact ? "mb-3 py-2" : "mb-6",
      )}
    >
      <Info className="h-4 w-4" />
      <AlertTitle className={compact ? "text-sm" : undefined}>Modo teste</AlertTitle>
      <AlertDescription className={cn("text-sm", compact && "text-xs")}>
        <p>
          Mensagens que você envia ainda não chegam no celular do cliente. Receber mensagens funciona normal.
        </p>
        {!compact && data?.isConnected && (
          <p className="text-xs opacity-80 mt-1">WhatsApp: conectado ✓</p>
        )}
      </AlertDescription>
    </Alert>
  );
}
