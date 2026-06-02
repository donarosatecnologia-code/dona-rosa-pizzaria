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
import { WhatsappMessagePreview } from "@/components/admin/templates/WhatsappMessagePreview";
import { useSendWhatsappMessage } from "@/hooks/whatsapp/useSendWhatsappMessage";
import { useApprovedWhatsappTemplates } from "@/hooks/whatsapp/useWhatsappTemplates";

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
      toast.success(result.dry_run ? "Modelo simulado (dry-run)." : "Modelo enviado!");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <Send className="h-4 w-4 mr-2" />
          Enviar modelo
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Enviar modelo aprovado</SheetTitle>
          <SheetDescription>
            Fora da janela de 24h, só é possível enviar modelos aprovados pela Meta.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando modelos...</p>}
          {!isLoading && (!templates || templates.length === 0) && (
            <p className="text-sm text-muted-foreground">
              Nenhum modelo aprovado disponível. Crie e submeta um em Modelos.
            </p>
          )}
          {templates?.map((template) => (
            <div key={template.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{template.display_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{template.name}</p>
                </div>
                <Button
                  size="sm"
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
      </SheetContent>
    </Sheet>
  );
}
