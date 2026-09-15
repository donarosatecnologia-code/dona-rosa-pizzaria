import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Search, Send, Loader2 } from "lucide-react";
import { BroadcastSendConfirmDialog } from "@/components/admin/disparos/BroadcastSendConfirmDialog";
import { ListPagination } from "@/components/admin/ListPagination";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBroadcastCampaigns,
  useBroadcastCampaignRecipients,
  useBroadcastResponses,
  useBroadcastSend,
  useSurveyCampaignResults,
  useSurveyFlows,
  useWhatsappBroadcastRealtime,
  useWhatsappContactsByIds,
} from "@/hooks/whatsapp";
import { LIST_PAGE_SIZE, usePagedItems } from "@/hooks/usePagedItems";
import { useQueueContactCount } from "@/hooks/whatsapp/useQueueContactCount";
import { buildCampaignReportCsv, downloadCsvFile } from "@/lib/whatsapp/exportSurveyCsv";
import type { BroadcastCampaignRecipient } from "@/integrations/supabase/types/whatsapp-broadcast";
import type { SurveySessionAnswer, SurveyStep } from "@/integrations/supabase/types/survey-flows";
import { formatPhoneDisplay } from "@/lib/format-phone";

const CHART_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#dc2626", "#9333ea"];

type RecipientFilter = "all" | "responded" | "not_responded" | "failed";

function isDryRunMessageId(metaMessageId: string | null | undefined): boolean {
  return Boolean(metaMessageId?.startsWith("dry_run_"));
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

interface RecipientRowView {
  recipient: BroadcastCampaignRecipient;
  name: string;
  phone: string;
  phoneDigits: string;
  responded: boolean;
  surveyStatus: string | null;
  answersByStep: Map<number, SurveySessionAnswer>;
  displayStatus: string;
  failureReason: string | null;
  isFailed: boolean;
}

export default function AdminDisparoDetail() {
  const { id } = useParams<{ id: string }>();
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  useWhatsappBroadcastRealtime();

  const { data: campaigns } = useBroadcastCampaigns();
  const campaign = campaigns?.find((c) => c.id === id);
  const { data: recipients, isLoading: loadingRecipients } = useBroadcastCampaignRecipients(id);
  const { data: responses, isLoading: loadingResponses } = useBroadcastResponses(id);
  const { data: surveySessions, isLoading: loadingSurvey } = useSurveyCampaignResults(id);
  const { data: surveyFlows } = useSurveyFlows();
  const recipientContactIds = useMemo(
    () => (recipients ?? []).map((recipient) => recipient.contact_id),
    [recipients],
  );
  const { data: contacts } = useWhatsappContactsByIds(recipientContactIds);
  const send = useBroadcastSend();
  const { data: queueContactCount, isLoading: loadingQueueCount } = useQueueContactCount(
    campaign?.queue_id ?? campaign?.queue_id_draft,
  );

  const contactById = useMemo(
    () => new Map(contacts?.map((c) => [c.id, c]) ?? []),
    [contacts],
  );
  const campaignLabel =
    campaign?.template_name ?? campaign?.template_name_draft ?? "campanha";

  const responseDistribution = (responses ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.response_value] = (acc[r.response_value] ?? 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(responseDistribution).map(([name, value]) => ({ name, value }));

  const surveyFlowId = campaign?.survey_flow_id ?? campaign?.survey_flow_id_draft;
  const surveyFlow = surveyFlows?.find((f) => f.id === surveyFlowId);
  const surveySteps = (surveyFlow?.steps ?? []) as SurveyStep[];
  const isSurveyCampaign =
    (campaign?.content_type ?? campaign?.content_type_draft) === "survey" && surveySteps.length > 0;

  const completedSurveys = (surveySessions ?? []).filter((s) => s.status === "completed").length;
  const responseCount = isSurveyCampaign ? completedSurveys : (responses?.length ?? 0);

  const respondedContactIds = useMemo(() => {
    if (isSurveyCampaign) {
      return new Set(
        (surveySessions ?? [])
          .filter((session) => session.status === "completed" || (session.answers?.length ?? 0) > 0)
          .map((session) => session.contact_id),
      );
    }
    return new Set((responses ?? []).map((response) => response.contact_id));
  }, [isSurveyCampaign, surveySessions, responses]);

  const deliveryBase =
    (campaign?.total_delivered ?? 0) > 0
      ? campaign!.total_delivered
      : isSurveyCampaign && completedSurveys > 0
        ? Math.max(campaign?.total_sent ?? 0, completedSurveys)
        : 0;

  const responseRate = deliveryBase > 0 ? Math.round((responseCount / deliveryBase) * 100) : 0;

  const dryRunRecipientCount = useMemo(
    () => (recipients ?? []).filter((r) => isDryRunMessageId(r.meta_message_id)).length,
    [recipients],
  );
  const realMetaIdCount = useMemo(
    () =>
      (recipients ?? []).filter(
        (r) => r.meta_message_id && !isDryRunMessageId(r.meta_message_id),
      ).length,
    [recipients],
  );

  const surveySessionByContactId = useMemo(() => {
    return new Map((surveySessions ?? []).map((session) => [session.contact_id, session]));
  }, [surveySessions]);

  const recipientRows = useMemo((): RecipientRowView[] => {
    return (recipients ?? []).map((recipient) => {
      const contact = contactById.get(recipient.contact_id);
      const surveySession = surveySessionByContactId.get(recipient.contact_id);
      const responded = respondedContactIds.has(recipient.contact_id);
      const displayStatus =
        responded && (recipient.send_status === "failed" || recipient.send_status === "sent")
          ? "delivered"
          : recipient.send_status;
      const isFailed = displayStatus === "failed";
      const failureReason = isFailed
        ? recipient.failure_reason
        : responded && recipient.send_status === "failed"
          ? "Respondida — status Meta inconsistente"
          : null;

      return {
        recipient,
        name: contact?.name?.trim() || "Sem nome",
        phone: contact ? formatPhoneDisplay(contact.phone_number) : "—",
        phoneDigits: contact ? digitsOnly(contact.phone_number) : "",
        responded,
        surveyStatus: surveySession?.status ?? null,
        answersByStep: new Map((surveySession?.answers ?? []).map((answer) => [answer.step_index, answer])),
        displayStatus,
        failureReason,
        isFailed,
      };
    });
  }, [recipients, contactById, respondedContactIds, surveySessionByContactId]);

  const recipientSummary = useMemo(() => {
    const responded = recipientRows.filter((row) => row.responded).length;
    const failed = recipientRows.filter((row) => row.isFailed).length;
    const notResponded = recipientRows.filter((row) => !row.responded && !row.isFailed).length;
    return {
      total: recipientRows.length,
      responded,
      notResponded,
      failed,
    };
  }, [recipientRows]);

  const filteredRecipients = useMemo(() => {
    const query = normalizeSearch(recipientSearch);
    const queryDigits = digitsOnly(recipientSearch);

    return recipientRows.filter((row) => {
      if (recipientFilter === "responded" && !row.responded) {
        return false;
      }
      if (recipientFilter === "not_responded" && (row.responded || row.isFailed)) {
        return false;
      }
      if (recipientFilter === "failed" && !row.isFailed) {
        return false;
      }

      if (!query) {
        return true;
      }

      const nameMatch = row.name.toLowerCase().includes(query);
      const phoneMatch =
        row.phone.toLowerCase().includes(query) ||
        (queryDigits.length > 0 && row.phoneDigits.includes(queryDigits));
      return nameMatch || phoneMatch;
    });
  }, [recipientRows, recipientFilter, recipientSearch]);

  const {
    page: recipientPage,
    setPage: setRecipientPage,
    pageItems: pagedRecipients,
    totalPages: recipientTotalPages,
    total: recipientFilteredTotal,
  } = usePagedItems(filteredRecipients, LIST_PAGE_SIZE);

  useEffect(() => {
    setRecipientPage(0);
  }, [recipientFilter, recipientSearch, setRecipientPage]);

  async function handleSend() {
    if (!id) {
      return;
    }
    const toastId = toast.loading("Disparando mensagens…");
    try {
      const result = await send.mutateAsync({
        campaign_id: id,
        onProgress: (progress) => {
          toast.loading(
            `Enviando… ${progress.sentTotal} enviada(s), ${progress.pendingRemaining} pendente(s)`,
            { id: toastId },
          );
        },
      });
      const dryRunNote = result.dry_run ? " (modo teste — Meta não recebeu)" : "";
      const failedSuffix = result.failed > 0 ? `, ${result.failed} falha(s)` : "";
      const pendingSuffix =
        result.pending_remaining > 0
          ? `. Ainda restam ${result.pending_remaining} pendente(s) — clique em Disparar de novo.`
          : ".";
      toast.success(
        `${result.sent} mensagem(ns) enviada(s)${failedSuffix}${dryRunNote}${pendingSuffix}`,
        { id: toastId },
      );
      setConfirmSendOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Disparo falhou.";
      toast.error(message, { id: toastId });
    }
  }

  function responseLabelForRow(row: RecipientRowView): string {
    if (row.surveyStatus === "completed") {
      return "Concluída";
    }
    if (row.surveyStatus === "in_progress") {
      return "Em andamento";
    }
    return row.responded ? "Respondeu" : "Não respondeu";
  }

  function handleExportCsv() {
    if (filteredRecipients.length === 0) {
      toast.error("Não há linhas para exportar com o filtro/busca atuais.");
      return;
    }

    const exportRows = filteredRecipients.map((row) => ({
      name: row.name,
      phone: row.phone,
      sendStatus: row.displayStatus,
      responseLabel: responseLabelForRow(row),
      failureReason: row.failureReason ?? "",
      sentAt: row.recipient.sent_at
        ? new Date(row.recipient.sent_at).toLocaleString("pt-BR").replace(", ", " ")
        : "",
      stepAnswers: isSurveyCampaign
        ? surveySteps.map((_, index) => {
            const answer = row.answersByStep.get(index);
            return answer?.response_label ?? answer?.response_value ?? "";
          })
        : undefined,
    }));

    const csv = buildCampaignReportCsv(
      campaignLabel,
      exportRows,
      isSurveyCampaign ? surveySteps : [],
    );
    const safeName = campaignLabel.replace(/[^\w-]+/g, "_").slice(0, 40);
    downloadCsvFile(`relatorio_${safeName}_${id?.slice(0, 8)}.csv`, csv);
    toast.success("CSV exportado com as mesmas colunas da tela.");
  }

  if (!campaign && campaigns) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-muted-foreground">Campanha não encontrada.</p>
        <Link to="/admin/disparos" className="text-sm text-primary hover:underline mt-2 inline-block">
          Voltar aos disparos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to="/admin/disparos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos disparos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold">
            {campaign?.template_name ?? campaign?.template_name_draft ?? "Campanha"}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            Tipo: {campaign?.content_type ?? campaign?.content_type_draft ?? "—"}
          </p>
        </div>
        {campaign?.published_at && (
          <Button size="sm" disabled={send.isPending} onClick={() => setConfirmSendOpen(true)}>
            {send.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                {campaign.status === "sending" ? "Continuar disparo" : "Disparar"}
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Enviadas", value: campaign?.total_sent ?? 0 },
          { label: "Entregues", value: campaign?.total_delivered ?? 0 },
          { label: "Respostas", value: responseCount },
          { label: "Taxa resposta", value: `${responseRate}%` },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {dryRunRecipientCount > 0 && (
        <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-950">
          <AlertTitle>Disparo em modo teste (dry-run)</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>
              {dryRunRecipientCount} mensagem(ns) têm ID <code className="text-xs">dry_run_…</code> —
              a Meta <strong>não recebeu</strong> esses envios. Por isso entregues = 0.
            </p>
            <p>
              No Supabase → Edge Functions → Secrets, defina{" "}
              <code className="text-xs">BROADCAST_DRY_RUN=false</code>, faça redeploy de{" "}
              <code className="text-xs">broadcast-send</code> e dispare de novo.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {dryRunRecipientCount === 0 &&
        realMetaIdCount > 0 &&
        (campaign?.total_delivered ?? 0) === 0 &&
        (campaign?.total_sent ?? 0) > 0 &&
        completedSurveys === 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-950">
            <AlertTitle>Envio aceito pela Meta, sem confirmação de entrega</AlertTitle>
            <AlertDescription className="text-sm">
              Os IDs são reais (<code className="text-xs">wamid.…</code>). Confira o webhook de status
              e a qualidade do número no WhatsApp Manager.
            </AlertDescription>
          </Alert>
        )}

      {isSurveyCampaign && completedSurveys > 0 && (campaign?.total_delivered ?? 0) === 0 && (
        <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
          <AlertTitle>Pesquisa respondida com sucesso</AlertTitle>
          <AlertDescription className="text-sm">
            Houve resposta concluída, então a mensagem chegou ao cliente. O contador &quot;Entregues&quot;
            pode ficar atrasado se a Meta não enviar o status de entrega — isso não invalida as respostas.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                {isSurveyCampaign && surveyFlow
                  ? `Destinatários e respostas — ${surveyFlow.name}`
                  : "Destinatários e respostas"}
              </CardTitle>
              {isSurveyCampaign && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nome, status do envio e respostas de cada pergunta na mesma tabela.
                </p>
              )}
            </div>
            {filteredRecipients.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-1" />
                Exportar CSV
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: "all" as const, label: "Todos", value: recipientSummary.total },
              { key: "responded" as const, label: "Responderam", value: recipientSummary.responded },
              {
                key: "not_responded" as const,
                label: "Não responderam",
                value: recipientSummary.notResponded,
              },
              { key: "failed" as const, label: "Falharam", value: recipientSummary.failed },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRecipientFilter(item.key)}
                className={`rounded-lg border px-3 py-2 text-left transition-colors min-h-[44px] ${
                  recipientFilter === item.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 min-h-[44px]"
                placeholder="Buscar por nome ou telefone..."
                value={recipientSearch}
                onChange={(event) => setRecipientSearch(event.target.value)}
              />
            </div>
            <Select
              value={recipientFilter}
              onValueChange={(value) => setRecipientFilter(value as RecipientFilter)}
            >
              <SelectTrigger className="min-h-[44px] sm:w-[220px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="responded">Quem respondeu</SelectItem>
                <SelectItem value="not_responded">Quem não respondeu</SelectItem>
                <SelectItem value="failed">Falhas (com motivo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {(loadingRecipients || (isSurveyCampaign && loadingSurvey)) && (
            <Skeleton className="h-24 w-full" />
          )}
          {!loadingRecipients && recipientRows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum destinatário ainda. Dispare a campanha para popular.
            </p>
          )}
          {!loadingRecipients && recipientRows.length > 0 && filteredRecipients.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum destinatário com esse filtro/busca.</p>
          )}
          {pagedRecipients.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Envio</TableHead>
                      <TableHead>Resposta</TableHead>
                      <TableHead>Motivo da falha</TableHead>
                      <TableHead>Enviado em</TableHead>
                      {isSurveyCampaign &&
                        surveySteps.map((step, index) => (
                          <TableHead key={step.id} className="min-w-[120px]">
                            {index + 1}. {step.question.slice(0, 40)}
                            {step.question.length > 40 ? "…" : ""}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRecipients.map((row) => (
                      <TableRow key={row.recipient.id}>
                        <TableCell className="font-medium max-w-[160px] truncate">
                          {row.name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{row.phone}</TableCell>
                        <TableCell>
                          <Badge variant={row.isFailed ? "destructive" : "outline"}>
                            {row.displayStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.responded ? "secondary" : "outline"}>
                            {row.surveyStatus === "completed"
                              ? "Concluída"
                              : row.surveyStatus === "in_progress"
                                ? "Em andamento"
                                : row.responded
                                  ? "Respondeu"
                                  : "Não respondeu"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                          {row.failureReason ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {row.recipient.sent_at
                            ? new Date(row.recipient.sent_at).toLocaleString("pt-BR")
                            : "—"}
                        </TableCell>
                        {isSurveyCampaign &&
                          surveySteps.map((_, index) => {
                            const answer = row.answersByStep.get(index);
                            return (
                              <TableCell key={index} className="text-xs">
                                {answer?.response_label ?? answer?.response_value ?? "—"}
                              </TableCell>
                            );
                          })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ListPagination
                page={recipientPage}
                totalPages={recipientTotalPages}
                total={recipientFilteredTotal}
                onPageChange={setRecipientPage}
                label="destinatário(s)"
              />
            </>
          )}
        </CardContent>
      </Card>

      {!isSurveyCampaign && chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Resultados da pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {!isSurveyCampaign && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Respostas recebidas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingResponses && <Skeleton className="h-24 w-full" />}
            {!loadingResponses && (!responses || responses.length === 0) && (
              <p className="text-sm text-muted-foreground">Aguardando respostas dos clientes...</p>
            )}
            {!loadingResponses && responses && responses.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Use o filtro &quot;Quem respondeu&quot; na tabela de destinatários acima para ver nome,
                telefone e status.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <BroadcastSendConfirmDialog
        open={confirmSendOpen}
        onOpenChange={setConfirmSendOpen}
        contactCount={queueContactCount ?? 0}
        isLoadingCount={loadingQueueCount}
        isSending={send.isPending}
        onConfirm={handleSend}
      />
    </div>
  );
}
