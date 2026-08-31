import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Send, Plus, Loader2, ChevronRight, Trash2, CheckCircle2, Search, User } from "lucide-react";
import { BroadcastSendConfirmDialog } from "@/components/admin/disparos/BroadcastSendConfirmDialog";
import { SendActiveMessageDialog } from "@/components/admin/disparos/SendActiveMessageDialog";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBroadcastCampaigns,
  useBroadcastSend,
  useCreateBroadcastCampaignDraft,
  useDeleteBroadcastCampaign,
  usePublishBroadcastCampaign,
  useApprovedWhatsappTemplates,
  useWhatsappContacts,
  useWhatsappQueues,
  useQueueContactCount,
  useSurveyFlows,
  useWhatsappPhoneStatus,
  useWhatsappContactsPage,
} from "@/hooks/whatsapp";
import type { BroadcastCampaign } from "@/integrations/supabase/types/whatsapp-broadcast";
import { formatPhoneDisplay } from "@/lib/format-phone";
import { canInteractViaWhatsapp } from "@/lib/whatsapp/contactTelefoneFixo";

type RecipientMode = "segment" | "single";

function statusLabel(status: BroadcastCampaign["status"]) {
  const map = {
    draft: { label: "Rascunho", variant: "secondary" as const },
    sending: { label: "Enviando", variant: "default" as const },
    completed: { label: "Concluída", variant: "outline" as const },
  };
  return map[status] ?? { label: status, variant: "secondary" as const };
}

export default function AdminDisparos() {
  const { data: approvedTemplates } = useApprovedWhatsappTemplates();
  const { data: campaigns, isLoading, error } = useBroadcastCampaigns();
  const { data: queues } = useWhatsappQueues();
  const { data: contacts } = useWhatsappContacts();
  const { data: surveyFlows } = useSurveyFlows();
  const createDraft = useCreateBroadcastCampaignDraft();
  const publish = usePublishBroadcastCampaign();
  const deleteCampaign = useDeleteBroadcastCampaign();
  const send = useBroadcastSend();
  const { data: phoneStatus } = useWhatsappPhoneStatus();
  const cloudReady = phoneStatus?.phone?.is_cloud_ready ?? false;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [singleDialogOpen, setSingleDialogOpen] = useState(false);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("segment");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [queueId, setQueueId] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [contentType, setContentType] = useState("informational");
  const [surveyFlowId, setSurveyFlowId] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [confirmCampaignId, setConfirmCampaignId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const confirmCampaign = campaigns?.find((c) => c.id === confirmCampaignId);
  const { data: confirmContactCount, isLoading: loadingConfirmCount } = useQueueContactCount(
    confirmCampaign?.target_contact_id ? undefined : (confirmCampaign?.queue_id ?? confirmCampaign?.queue_id_draft),
  );
  const resolvedConfirmCount = confirmCampaign?.target_contact_id ? 1 : (confirmContactCount ?? 0);

  const { data: contactSearchPage, isLoading: loadingContactSearch } = useWhatsappContactsPage({
    page: 0,
    search: contactSearch,
    pageSize: 20,
  });

  const contactOptions = useMemo(
    () => (contactSearchPage?.items ?? []).filter((contact) => canInteractViaWhatsapp(contact)),
    [contactSearchPage?.items],
  );

  useEffect(() => {
    if (contentType !== "survey" || !surveyFlowId || !queues?.length) {
      return;
    }
    const flow = surveyFlows?.find((f) => f.id === surveyFlowId);
    if (!flow?.suggested_queue_slug) {
      return;
    }
    const suggested = queues.find((q) => q.slug === flow.suggested_queue_slug);
    if (suggested) {
      setQueueId(suggested.id);
    }
  }, [contentType, surveyFlowId, surveyFlows, queues]);

  async function handleCreate() {
    const template = approvedTemplates?.find((t) => t.id === selectedTemplateId);
    if (!template) {
      toast.error("Selecione um modelo aprovado.");
      return;
    }
    if (recipientMode === "segment" && !queueId) {
      toast.error("Selecione o segmento de destinatários.");
      return;
    }
    if (recipientMode === "single" && !selectedContactId) {
      toast.error("Selecione o contato.");
      return;
    }
    if (contentType === "survey" && !surveyFlowId) {
      toast.error("Selecione qual pesquisa enviar.");
      return;
    }
    try {
      await createDraft.mutateAsync({
        template_name_draft: template.name,
        template_params_draft: {
          language: template.language,
          body: template.variables?.map((v) => v.example) ?? [],
        },
        content_type_draft: contentType,
        queue_id_draft: recipientMode === "segment" ? queueId : null,
        target_contact_id_draft: recipientMode === "single" ? selectedContactId : null,
        survey_flow_id_draft: contentType === "survey" ? surveyFlowId : null,
      });
      toast.success("Campanha criada como rascunho.");
      setDialogOpen(false);
    } catch {
      toast.error("Não foi possível criar a campanha.");
    }
  }

  async function handlePublish(campaignId: string) {
    try {
      await publish.mutateAsync(campaignId);
      toast.success("Campanha publicada.");
    } catch {
      toast.error("Publicação falhou. Verifique se há conteúdo em rascunho.");
    }
  }

  const deleteTarget = campaigns?.find((c) => c.id === deleteTargetId);

  async function handleDeleteCampaign() {
    if (!deleteTargetId) {
      return;
    }
    try {
      await deleteCampaign.mutateAsync(deleteTargetId);
      toast.success("Campanha excluída.");
      setDeleteTargetId(null);
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("campaign_sending_blocked")
          ? "Aguarde o envio terminar antes de excluir."
          : "Não foi possível excluir. Rode db:deploy se acabou de atualizar o sistema.";
      toast.error(msg);
    }
  }

  async function handleSend(campaignId: string) {
    setSendingId(campaignId);
    try {
      const result = await send.mutateAsync({ campaign_id: campaignId });
      const failedSuffix = result.failed > 0 ? `, ${result.failed} falha(s).` : ".";
      toast.success(`${result.sent} mensagem(ns) enviada(s)${failedSuffix}`);
      setConfirmCampaignId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Disparo falhou.";
      toast.error(message.includes("Failed to fetch") ? "Erro de conexão. Tente novamente." : "Disparo falhou. Campanha publicada?");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Send className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Mensagens ativas</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Envie mensagens ativas para um contato ou para um segmento ·{" "}
            <Link to="/admin/contatos" className="text-primary hover:underline">
              {contacts?.length ?? 0} contato(s)
            </Link>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button variant="outline" className="min-h-[44px]" onClick={() => setSingleDialogOpen(true)}>
            <User className="h-4 w-4 mr-2" />
            Um contato
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Nova campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova campanha (rascunho)</DialogTitle>
              <DialogDescription>
                Escolha um modelo aprovado e quem vai receber.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {(!approvedTemplates || approvedTemplates.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Nenhum modelo aprovado ainda.{" "}
                  <Link to="/admin/templates" className="text-primary hover:underline">
                    Crie e envie um modelo
                  </Link>{" "}
                  para aprovação primeiro.
                </p>
              )}
              <div className="space-y-2">
                <Label>Destinatários</Label>
                <Select
                  value={recipientMode}
                  onValueChange={(value) => setRecipientMode(value as RecipientMode)}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="segment">Segmento (lista)</SelectItem>
                    <SelectItem value="single">Um contato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo aprovado</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedTemplates?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de conteúdo</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="informational">Informativo</SelectItem>
                    <SelectItem value="survey">Pesquisa</SelectItem>
                    <SelectItem value="promotion">Promoção</SelectItem>
                    <SelectItem value="utility">Utilidade</SelectItem>
                    <SelectItem value="reminder">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {contentType === "survey" && (
                <div className="space-y-2">
                  <Label>Pesquisa</Label>
                  <Select value={surveyFlowId} onValueChange={setSurveyFlowId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a pesquisa" />
                    </SelectTrigger>
                    <SelectContent>
                      {surveyFlows?.map((flow) => (
                        <SelectItem key={flow.id} value={flow.id}>
                          {flow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!surveyFlows || surveyFlows.length === 0) && (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma pesquisa carregada.{" "}
                      <Link to="/admin/pesquisas" className="text-primary hover:underline">
                        Ver pesquisas
                      </Link>
                    </p>
                  )}
                </div>
              )}
              {recipientMode === "segment" ? (
                <div className="space-y-2">
                  <Label>Segmento de destinatários</Label>
                  <Select value={queueId} onValueChange={setQueueId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fila" />
                    </SelectTrigger>
                    <SelectContent>
                      {queues?.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
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
                      {loadingContactSearch && (
                        <SelectItem value="__loading" disabled>
                          Carregando...
                        </SelectItem>
                      )}
                      {!loadingContactSearch && contactOptions.length === 0 && (
                        <SelectItem value="__empty" disabled>
                          Nenhum contato com WhatsApp
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
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createDraft.isPending}>
                {createDraft.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar rascunho
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {cloudReady && (
        <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-950">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <AlertTitle>WhatsApp conectado</AlertTitle>
          <AlertDescription>
            Coexistência ativa — celular e painel sincronizados. Disparos reais liberados.
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar as campanhas.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (!campaigns || campaigns.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Nenhuma campanha ainda. Crie a primeira acima.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {campaigns?.map((campaign) => {
          const st = statusLabel(campaign.status);
          const canPublish = campaign.status === "draft" && !campaign.published_at;
          const canSend = Boolean(campaign.published_at && campaign.template_name);

          return (
            <Card key={campaign.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold">
                    {campaign.template_name ?? campaign.template_name_draft ?? "Sem template"}
                  </CardTitle>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Enviados</p>
                    <p className="font-medium">{campaign.total_sent}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Entregues</p>
                    <p className="font-medium">{campaign.total_delivered}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Publicada em</p>
                    <p className="font-medium text-xs">
                      {campaign.published_at
                        ? new Date(campaign.published_at).toLocaleString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canPublish && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={publish.isPending}
                      onClick={() => handlePublish(campaign.id)}
                    >
                      Publicar
                    </Button>
                  )}
                  {canSend && (
                    <Button
                      size="sm"
                      disabled={sendingId === campaign.id}
                      onClick={() => setConfirmCampaignId(campaign.id)}
                    >
                      {sendingId === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Disparar
                        </>
                      )}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/disparos/${campaign.id}`}>
                      Ver relatório
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                  {campaign.status !== "sending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTargetId(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{campaign.id}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <BroadcastSendConfirmDialog
        open={Boolean(confirmCampaignId)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmCampaignId(null);
          }
        }}
        contactCount={resolvedConfirmCount}
        isLoadingCount={confirmCampaign?.target_contact_id ? false : loadingConfirmCount}
        isSending={Boolean(sendingId && sendingId === confirmCampaignId)}
        onConfirm={() => {
          if (confirmCampaignId) {
            handleSend(confirmCampaignId);
          }
        }}
      />

      <SendActiveMessageDialog open={singleDialogOpen} onOpenChange={setSingleDialogOpen} />

      <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha{" "}
              <strong>
                {deleteTarget?.template_name ?? deleteTarget?.template_name_draft ?? "sem nome"}
              </strong>{" "}
              será removida do painel, incluindo relatório e histórico de envio desta campanha. Não dá
              para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCampaign.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteCampaign();
              }}
            >
              {deleteCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
