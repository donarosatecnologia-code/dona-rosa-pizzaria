import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import { WhatsappMessagePreview } from "@/components/admin/templates/WhatsappMessagePreview";
import { useSendWhatsappMessage } from "@/hooks/whatsapp/useSendWhatsappMessage";
import { useApprovedWhatsappTemplates } from "@/hooks/whatsapp/useWhatsappTemplates";
import { toAdminUserMessage } from "@/lib/adminUserMessage";

interface SendTemplateSheetProps {
  conversationId: string;
}

export function SendTemplateSheet({ conversationId }: SendTemplateSheetProps) {
  const [open, setOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { data: templates, isLoading } = useApprovedWhatsappTemplates();
  const send = useSendWhatsappMessage();

  async function handleSend(templateId: string) {
    setSendingId(templateId);
    try {
      const result = await send.mutateAsync({
        conversation_id: conversationId,
        action: "template",
        template_id: templateId,
      });
      toast.success(result.dry_run ? "Salvou no modo teste (não chegou no celular)." : "Enviou!");
      setOpen(false);
    } catch (err) {
      toast.error(toAdminUserMessage(err instanceof Error ? err.message : undefined));
    } finally {
      setSendingId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="min-h-[44px]">
          <Send className="h-4 w-4 mr-2" />
          Enviar mensagem pronta
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 px-6 pt-6">
          <SheetTitle>Enviar mensagem pronta</SheetTitle>
          <SheetDescription>
            Passou de 24h — só mensagens já aprovadas pelo WhatsApp.
          </SheetDescription>
        </SheetHeader>
        <AppScrollArea className="flex-1 min-h-0">
          <div className="px-6 mt-4 pb-6 space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!isLoading && (!templates || templates.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Nenhuma mensagem pronta disponível. Crie uma em Mensagens prontas.
              </p>
            )}
            {templates?.map((template) => (
              <div key={template.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{template.display_name}</p>
                  </div>
                  <Button
                    size="sm"
                    className="min-h-[44px] shrink-0"
                    disabled={sendingId === template.id}
                    onClick={() => handleSend(template.id)}
                  >
                    {sendingId === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Enviar"
                    )}
                  </Button>
                </div>
                <WhatsappMessagePreview
                  body={template.body}
                  variables={template.variables ?? []}
                />
              </div>
            ))}
          </div>
        </AppScrollArea>
      </SheetContent>
    </Sheet>
  );
}
