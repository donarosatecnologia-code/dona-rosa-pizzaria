import { Link } from "react-router-dom";
import { useState } from "react";
import { Send, Plus, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { WhatsappDevBanner } from "@/components/admin/whatsapp/WhatsappDevBanner";
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
import { Label } from "@/components/ui/label";
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
  usePublishBroadcastCampaign,
  useApprovedWhatsappTemplates,
  useWhatsappContacts,
  useWhatsappQueues,
} from "@/hooks/whatsapp";
import type { BroadcastCampaign } from "@/integrations/supabase/types/whatsapp-broadcast";

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
  const createDraft = useCreateBroadcastCampaignDraft();
  const publish = usePublishBroadcastCampaign();
  const send = useBroadcastSend();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [queueId, setQueueId] = useState("");
  const [contentType, setContentType] = useState("informational");
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleCreate() {
    const template = approvedTemplates?.find((t) => t.id === selectedTemplateId);
    if (!template || !queueId) {
      toast.error("Selecione um modelo aprovado e a fila.");
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
        queue_id_draft: queueId,
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

  async function handleSend(campaignId: string) {
    setSendingId(campaignId);
    try {
      const result = await send.mutateAsync({ campaign_id: campaignId });
      toast.success(
        result.dry_run
          ? `Simulação: ${result.sent} enviado(s), ${result.failed} falha(s).`
          : `${result.sent} mensagem(ns) enviada(s).`,
      );
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
            <h1 className="text-2xl font-bold">Disparos</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Campanhas ativas via WhatsApp ·{" "}
            <Link to="/admin/contatos" className="text-primary hover:underline">
              {contacts?.length ?? 0} contato(s)
            </Link>
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Nova campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova campanha (rascunho)</DialogTitle>
              <DialogDescription>
                Escolha um modelo já aprovado pela Meta e a fila de destinatários.
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
              <div className="space-y-2">
                <Label>Fila de destinatários</Label>
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

      <WhatsappDevBanner />

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
                      onClick={() => handleSend(campaign.id)}
                    >
                      {sendingId === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Disparar (simulado)
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
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{campaign.id}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
