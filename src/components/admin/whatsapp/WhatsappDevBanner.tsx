import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useWhatsappConnectionStatus } from "@/hooks/whatsapp";

export function WhatsappDevBanner() {
  const { data } = useWhatsappConnectionStatus();

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
      <Info className="h-4 w-4" />
      <AlertTitle>Modo desenvolvimento — WhatsApp</AlertTitle>
      <AlertDescription className="text-sm space-y-1">
        <p>
          Recebimento (celular → Supabase) funciona. Disparos usam{" "}
          <strong>simulação (dry-run)</strong> até conectar número brasileiro real.
        </p>
        <p className="text-xs opacity-80">
          Conexão Meta: {data?.isConnected ? "ativa" : "pendente"}
          {data?.lastWebhookAt ? ` · último webhook ${new Date(data.lastWebhookAt).toLocaleString("pt-BR")}` : ""}
        </p>
      </AlertDescription>
    </Alert>
  );
}
