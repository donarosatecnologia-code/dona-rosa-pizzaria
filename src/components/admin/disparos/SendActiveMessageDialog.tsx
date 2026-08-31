import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { BroadcastSendConfirmDialog } from "@/components/admin/disparos/BroadcastSendConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApprovedWhatsappTemplates,
  useBroadcastSend,
  useCreateBroadcastCampaignDraft,
  usePublishBroadcastCampaign,
  useWhatsappContactsPage,
} from "@/hooks/whatsapp";
import { formatPhoneDisplay } from "@/lib/format-phone";
import { canInteractViaWhatsapp } from "@/lib/whatsapp/contactTelefoneFixo";

interface SendActiveMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pré-seleciona um contato (ex.: ação na lista de clientes). */
  initialContactId?: string;
}

export function SendActiveMessageDialog({
  open,
  onOpenChange,
  initialContactId,
}: SendActiveMessageDialogProps) {
  const { data: approvedTemplates } = useApprovedWhatsappTemplates();
  const createDraft = useCreateBroadcastCampaignDraft();
  const publish = usePublishBroadcastCampaign();
  const send = useBroadcastSend();

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [contentType, setContentType] = useState("informational");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(initialContactId ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { data: contactPage, isLoading: loadingContacts } = useWhatsappContactsPage({
    page: 0,
    search: contactSearch,
    pageSize: 20,
  });

  const contactOptions = useMemo(
    () => (contactPage?.items ?? []).filter((contact) => canInteractViaWhatsapp(contact)),
    [contactPage?.items],
  );

  useEffect(() => {
    if (open && initialContactId) {
      setSelectedContactId(initialContactId);
    }
  }, [open, initialContactId]);

  useEffect(() => {
    if (!open) {
      setSelectedTemplateId("");
      setContentType("informational");
      setContactSearch("");
      setSelectedContactId(initialContactId ?? "");
      setConfirmOpen(false);
    }
  }, [open, initialContactId]);

  async function handleCreateAndSend() {
    const template = approvedTemplates?.find((item) => item.id === selectedTemplateId);
    if (!template || !selectedContactId) {
      toast.error("Selecione o modelo e o contato.");
      return;
    }

    setIsSending(true);
    try {
      const draft = await createDraft.mutateAsync({
        template_name_draft: template.name,
        template_params_draft: {
          language: template.language,
          body: template.variables?.map((variable) => variable.example) ?? [],
        },
        content_type_draft: contentType,
        queue_id_draft: null,
        target_contact_id_draft: selectedContactId,
      });

      await publish.mutateAsync(draft.id);
      const result = await send.mutateAsync({ campaign_id: draft.id, limit: 1 });
      const failedSuffix = result.failed > 0 ? ` (${result.failed} falha)` : "";
      toast.success(`Mensagem ativa enviada${failedSuffix}.`);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível enviar.";
      toast.error(message.includes("Failed to fetch") ? "Erro de conexão. Tente novamente." : "Envio falhou.");
    } finally {
      setIsSending(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar mensagem ativa</DialogTitle>
            <DialogDescription>
              Escolha um modelo aprovado e um contato com WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Modelo aprovado</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {approvedTemplates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de conteúdo</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informational">Informativo</SelectItem>
                  <SelectItem value="promotion">Promoção</SelectItem>
                  <SelectItem value="utility">Utilidade</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contato</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 min-h-[44px]"
                  placeholder="Buscar nome ou telefone..."
                  value={contactSearch}
                  onChange={(event) => setContactSearch(event.target.value)}
                />
              </div>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Selecione o contato" />
                </SelectTrigger>
                <SelectContent>
                  {loadingContacts && (
                    <SelectItem value="__loading" disabled>
                      Carregando...
                    </SelectItem>
                  )}
                  {!loadingContacts && contactOptions.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      Nenhum contato com WhatsApp encontrado
                    </SelectItem>
                  )}
                  {contactOptions.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} · {formatPhoneDisplay(contact.phone_number)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="min-h-[44px]"
              disabled={!selectedTemplateId || !selectedContactId || isSending}
              onClick={() => setConfirmOpen(true)}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BroadcastSendConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        contactCount={1}
        isLoadingCount={false}
        isSending={isSending}
        onConfirm={() => void handleCreateAndSend()}
      />
    </>
  );
}
