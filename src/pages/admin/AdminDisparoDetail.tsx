import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, ExternalLink, Search, Send, Loader2 } from "lucide-react";
import { BroadcastSendConfirmDialog } from "@/components/admin/disparos/BroadcastSendConfirmDialog";
import { ListPagination } from "@/components/admin/ListPagination";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

type RecipientFilter =
  | "all"
  | "received"
  | "sent_unconfirmed"
  | "not_sent"
  | "failed"
  | "needs_oi"
  | "ready_questions"
  | "survey_in_progress"
  | "survey_done"
  | "responded"
  | "not_responded";

function isDryRunMessageId(metaMessageId: string | null | undefined): boolean {
  return Boolean(metaMessageId?.startsWith("dry_run_"));
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function isWithinLast24Hours(iso: string | null | undefined): boolean {
  if (!iso) {
    return false;
  }
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) {
    return false;
  }
  return Date.now() - ts <= WINDOW_24H_MS;
}

interface RecipientRowView {
  recipient: BroadcastCampaignRecipient;
  contactId: string;
  name: string;
  phone: string;
  phoneDigits: string;
  responded: boolean;
  surveyStatus: string | null;
  answersByStep: Map<number, SurveySessionAnswer>;
  displayStatus: string;
  failureReason: string | null;
  isFailed: boolean;
  wasSent: boolean;
  wasReceived: boolean;
  needsOi: boolean;
  readyForQuestions: boolean;
  surveyInProgress: boolean;
  lastInboundAt: string | null;
}

export default function AdminDisparoDetail() {
  const { id } = useParams<{ id: string }>();
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [sendingContactId, setSendingContactId] = useState<string | null>(null);
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

      const wasSent = ["sent", "delivered", "read"].includes(recipient.send_status) || responded;
      const wasReceived =
        ["delivered", "read"].includes(displayStatus) ||
        responded ||
        surveySession?.status === "completed" ||
        surveySession?.status === "in_progress";
      const lastInboundAt = contact?.last_inbound_at ?? null;
      const surveyDone = surveySession?.status === "completed";
      const surveyInProgress = surveySession?.status === "in_progress";
      const openWindow = isWithinLast24Hours(lastInboundAt);
      // Só quem ainda não iniciou a pesquisa e tem janela Meta aberta.
      const readyForQuestions =
        isSurveyCampaign && wasSent && !surveyDone && !surveyInProgress && openWindow;
      // Pedir oi = já teve entrega/engajamento, mas sem janela 24h e sem pesquisa ativa.
      const needsOi =
        isSurveyCampaign &&
        wasReceived &&
        !surveyDone &&
        !surveyInProgress &&
        !readyForQuestions &&
        !isFailed;

      return {
        recipient,
        contactId: recipient.contact_id,
        name: contact?.name?.trim() || "Sem nome",
        phone: contact ? formatPhoneDisplay(contact.phone_number) : "—",
        phoneDigits: contact ? digitsOnly(contact.phone_number) : "",
        responded,
        surveyStatus: surveySession?.status ?? null,
        answersByStep: new Map(
          (surveySession?.answers ?? []).map((answer) => [answer.step_index, answer]),
        ),
        displayStatus,
        failureReason,
        isFailed,
        wasSent,
        wasReceived,
        needsOi,
        readyForQuestions,
        surveyInProgress,
        lastInboundAt,
      };
    });
  }, [recipients, contactById, respondedContactIds, surveySessionByContactId, isSurveyCampaign]);

  const recipientSummary = useMemo(() => {
    const responded = recipientRows.filter((row) => row.responded).length;
    const failed = recipientRows.filter((row) => row.isFailed).length;
    const notResponded = recipientRows.filter((row) => !row.responded && !row.isFailed).length;
    const received = recipientRows.filter((row) => row.wasReceived).length;
    const sentUnconfirmed = recipientRows.filter(
      (row) => row.wasSent && !row.wasReceived && !row.isFailed,
    ).length;
    const notSent = recipientRows.filter((row) => !row.wasSent && !row.isFailed).length;
    const needsOi = recipientRows.filter((row) => row.needsOi).length;
    const readyQuestions = recipientRows.filter((row) => row.readyForQuestions).length;
    const surveyInProgress = recipientRows.filter((row) => row.surveyInProgress).length;
    const surveyDone = recipientRows.filter((row) => row.surveyStatus === "completed").length;
    return {
      total: recipientRows.length,
      responded,
      notResponded,
      failed,
      received,
      sentUnconfirmed,
      notSent,
      needsOi,
      readyQuestions,
      surveyInProgress,
      surveyDone,
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
      if (recipientFilter === "received" && !row.wasReceived) {
        return false;
      }
      if (
        recipientFilter === "sent_unconfirmed" &&
        !(row.wasSent && !row.wasReceived && !row.isFailed)
      ) {
        return false;
      }
      if (recipientFilter === "not_sent" && !(!row.wasSent && !row.isFailed)) {
        return false;
      }
      if (recipientFilter === "needs_oi" && !row.needsOi) {
        return false;
      }
      if (recipientFilter === "ready_questions" && !row.readyForQuestions) {
        return false;
      }
      if (recipientFilter === "survey_in_progress" && !row.surveyInProgress) {
        return false;
      }
      if (recipientFilter === "survey_done" && row.surveyStatus !== "completed") {
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
    setSelectedContactIds([]);
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

  async function handleStartSurveys(contactIds?: string[]) {
    if (!id) {
      return;
    }
    const ids = contactIds?.filter(Boolean) ?? [];
    const toastId = toast.loading(
      ids.length === 1
        ? "Enviando perguntas para 1 cliente…"
        : ids.length > 1
          ? `Enviando perguntas para ${ids.length} clientes…`
          : "Enviando perguntas da pesquisa…",
    );
    try {
      const result = await send.mutateAsync({
        campaign_id: id,
        mode: "start_surveys",
        contact_ids: ids.length > 0 ? ids : undefined,
        onProgress: (progress) => {
          toast.loading(
            `Perguntas… ${progress.sentTotal} enviada(s), ${progress.pendingRemaining} restante(s)`,
            { id: toastId },
          );
        },
      });
      if (result.sent === 0 && result.failed === 0) {
        const skippedNote =
          (result.skipped ?? 0) > 0
            ? ` ${result.skipped} já tinham pesquisa em andamento/concluída.`
            : "";
        toast.info(
          `Ninguém elegível agora.${skippedNote} Use o filtro “Prontos p/ perguntas” ou o botão por linha. Só entram quem escreveu nas últimas 24h.`,
          { id: toastId },
        );
        return;
      }
      const failedSuffix = result.failed > 0 ? `, ${result.failed} falha(s)` : "";
      toast.success(`${result.sent} pesquisa(s) iniciada(s)${failedSuffix}.`, { id: toastId });
      setSelectedContactIds([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não deu para enviar as perguntas.";
      toast.error(message, { id: toastId });
    }
  }

  async function handleStartSurveyForContact(contactId: string) {
    setSendingContactId(contactId);
    try {
      await handleStartSurveys([contactId]);
    } finally {
      setSendingContactId(null);
    }
  }

  function toggleSelectedContact(contactId: string, checked: boolean) {
    setSelectedContactIds((prev) => {
      if (checked) {
        return prev.includes(contactId) ? prev : [...prev, contactId];
      }
      return prev.filter((id) => id !== contactId);
    });
  }

  function toggleSelectAllReadyOnPage(checked: boolean) {
    const readyOnPage = pagedRecipients
      .filter((row) => row.readyForQuestions)
      .map((row) => row.contactId);
    setSelectedContactIds((prev) => {
      if (!checked) {
        const drop = new Set(readyOnPage);
        return prev.filter((id) => !drop.has(id));
      }
      const merged = new Set([...prev, ...readyOnPage]);
      return [...merged];
    });
  }

  function deliveryLabelForRow(row: RecipientRowView): string {
    if (row.isFailed) {
      return "Falhou";
    }
    if (row.wasReceived) {
      return "Receberam o template";
    }
    if (row.wasSent) {
      return "Só aceito (sem entrega)";
    }
    return "Não enviado";
  }

  function surveyStageLabelForRow(row: RecipientRowView): string {
    if (row.surveyStatus === "completed") {
      return "Pesquisa ok";
    }
    if (row.surveyInProgress) {
      return "Em andamento";
    }
    if (row.readyForQuestions) {
      return "Prontos p/ perguntas";
    }
    if (row.needsOi) {
      return "Pedir oi";
    }
    return "—";
  }

  function filterExportLabel(filter: RecipientFilter): string {
    const map: Record<RecipientFilter, string> = {
      all: "Todos",
      received: "Receberam o template",
      sent_unconfirmed: "Só aceito (sem entrega)",
      not_sent: "Ainda não enviados",
      failed: "Falharam",
      needs_oi: "Pedir oi",
      ready_questions: "Prontos p/ perguntas",
      survey_in_progress: "Em andamento",
      survey_done: "Pesquisa ok",
      responded: "Quem respondeu",
      not_responded: "Quem não respondeu",
    };
    return map[filter] ?? filter;
  }

  function handleExportCsv() {
    if (filteredRecipients.length === 0) {
      toast.error("Não há linhas para exportar com o filtro/busca atuais.");
      return;
    }

    const activeFilterLabel = filterExportLabel(recipientFilter);
    const searchNote = recipientSearch.trim() ? ` + busca "${recipientSearch.trim()}"` : "";
    const filterLabel = `${activeFilterLabel}${searchNote}`;

    const exportRows = filteredRecipients.map((row) => ({
      name: row.name,
      phone: row.phone,
      phoneDigits: row.phoneDigits,
      sendStatus: row.displayStatus,
      deliveryLabel: deliveryLabelForRow(row),
      surveyStageLabel: surveyStageLabelForRow(row),
      openWindowLabel: isWithinLast24Hours(row.lastInboundAt) ? "Sim" : "Não",
      failureReason: row.failureReason ?? "",
      sentAt: row.recipient.sent_at
        ? new Date(row.recipient.sent_at).toLocaleString("pt-BR").replace(", ", " ")
        : "",
      lastInboundAt: row.lastInboundAt
        ? new Date(row.lastInboundAt).toLocaleString("pt-BR").replace(", ", " ")
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
      filterLabel,
      exportRows,
      isSurveyCampaign ? surveySteps : [],
    );
    const safeName = campaignLabel.replace(/[^\w-]+/g, "_").slice(0, 40);
    const safeFilter = activeFilterLabel.replace(/[^\w-]+/g, "_").slice(0, 30);
    downloadCsvFile(
      `relatorio_${safeName}_${safeFilter}_${id?.slice(0, 8)}.csv`,
      csv,
    );
    toast.success(
      `CSV com ${filteredRecipients.length} linha(s) do filtro “${activeFilterLabel}”.`,
    );
  }

  const sentFromRecipients = recipientRows.filter((row) => row.wasSent).length;
  const deliveredFromRecipients = recipientRows.filter(
    (row) =>
      ["delivered", "read"].includes(row.recipient.send_status) ||
      (row.responded && row.wasSent),
  ).length;
  const displaySent =
    !loadingRecipients && recipientRows.length > 0
      ? Math.max(campaign?.total_sent ?? 0, sentFromRecipients)
      : (campaign?.total_sent ?? 0);
  const displayDelivered =
    !loadingRecipients && recipientRows.length > 0
      ? Math.max(campaign?.total_delivered ?? 0, deliveredFromRecipients)
      : (campaign?.total_delivered ?? 0);
  const deliveryBase =
    displayDelivered > 0
      ? displayDelivered
      : isSurveyCampaign && completedSurveys > 0
        ? Math.max(displaySent, completedSurveys)
        : 0;
  const responseRate = deliveryBase > 0 ? Math.round((responseCount / deliveryBase) * 100) : 0;

  if (!campaign && campaigns) {
    return (
      <AdminPageShell width="2xl">
        <p className="text-muted-foreground">Campanha não encontrada.</p>
        <Link to="/admin/disparos" className="text-sm text-primary hover:underline mt-2 inline-block">
          Voltar aos disparos
        </Link>
      </AdminPageShell>
    );
  }

  const deliveryChips = isSurveyCampaign
    ? [
        { key: "all" as const, label: "Todos", value: recipientSummary.total },
        {
          key: "received" as const,
          label: "Receberam o template",
          value: recipientSummary.received,
        },
        {
          key: "sent_unconfirmed" as const,
          label: "Só aceito (sem entrega)",
          value: recipientSummary.sentUnconfirmed,
        },
        { key: "failed" as const, label: "Falharam", value: recipientSummary.failed },
      ]
    : [
        { key: "all" as const, label: "Todos", value: recipientSummary.total },
        { key: "responded" as const, label: "Responderam", value: recipientSummary.responded },
        {
          key: "not_responded" as const,
          label: "Não responderam",
          value: recipientSummary.notResponded,
        },
        { key: "failed" as const, label: "Falharam", value: recipientSummary.failed },
      ];

  const surveyStageChips = [
    {
      key: "survey_in_progress" as const,
      label: "Em andamento",
      value: recipientSummary.surveyInProgress,
    },
    {
      key: "ready_questions" as const,
      label: "Prontos p/ perguntas",
      value: recipientSummary.readyQuestions,
    },
    { key: "needs_oi" as const, label: "Pedir oi", value: recipientSummary.needsOi },
    {
      key: "survey_done" as const,
      label: "Pesquisa ok",
      value: recipientSummary.surveyDone,
    },
  ];

  const surveyStageSum =
    recipientSummary.surveyInProgress +
    recipientSummary.readyQuestions +
    recipientSummary.needsOi +
    recipientSummary.surveyDone;

  return (
    <AdminPageShell width="2xl">
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
          <div className="flex flex-wrap gap-2">
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
            {isSurveyCampaign && (campaign.total_sent ?? 0) > 0 && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={send.isPending}
                  onClick={() =>
                    void handleStartSurveys(
                      selectedContactIds.length > 0 ? selectedContactIds : undefined,
                    )
                  }
                >
                  {send.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : selectedContactIds.length > 0 ? (
                    `Enviar perguntas (${selectedContactIds.length})`
                  ) : (
                    "Enviar a todos prontos (24h)"
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isSurveyCampaign && (
        <Alert className="mb-6 border-primary/30 bg-primary/5">
          <AlertTitle>Como ler estes números</AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>
              <strong>Entrega do template</strong> e <strong>etapa da pesquisa</strong> são coisas
              diferentes — não some tudo com &quot;Receberam&quot;.
            </p>
            <p>
              Conta da entrega: Receberam ({recipientSummary.received}) + Só aceito (
              {recipientSummary.sentUnconfirmed}) + Falharam ({recipientSummary.failed}) ≈ Todos (
              {recipientSummary.total}).
            </p>
            <p>
              Entre quem recebeu, a pesquisa se divide em: Em andamento (
              {recipientSummary.surveyInProgress}) + Prontos ({recipientSummary.readyQuestions}) +
              Pedir oi ({recipientSummary.needsOi}) + Ok ({recipientSummary.surveyDone}) ={" "}
              {surveyStageSum}
              {surveyStageSum === recipientSummary.received
                ? " (fecha com Receberam)."
                : ` (Receberam = ${recipientSummary.received}).`}
            </p>
            <p>
              Marque os prontos (checkbox) ou use <strong>Enviar</strong> na linha. O botão do topo
              envia aos selecionados — ou a todos prontos, se ninguém estiver marcado.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Enviadas", value: displaySent },
          { label: "Entregues", value: displayDelivered },
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
            Houve resposta concluída, então a mensagem chegou ao cliente. O contador
            &quot;Entregues&quot; da Meta pode atrasar.
          </AlertDescription>
        </Alert>
      )}

      {(campaign?.queue_id || campaign?.queue_id_draft) && (
        <p className="text-sm text-muted-foreground mb-4">
          Segmento: {loadingQueueCount ? "…" : `${queueContactCount ?? 0} contato(s) no grupo`}
        </p>
      )}

      <Card className="mb-6">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              {isSurveyCampaign && surveyFlow
                ? `Relatório — ${surveyFlow.name}`
                : "Destinatários e respostas"}
            </CardTitle>
            {filteredRecipients.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-1" />
                Exportar filtro ({filteredRecipients.length})
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {isSurveyCampaign ? "1. Entrega do template" : "Resumo"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {deliveryChips.map((item) => (
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
            </div>
            {isSurveyCampaign && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  2. Etapa da pesquisa (entre quem recebeu — não some com o bloco de cima)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {surveyStageChips.map((item) => (
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
              </div>
            )}
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
              <SelectTrigger className="min-h-[44px] sm:w-[240px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {isSurveyCampaign ? (
                  <>
                    <SelectItem value="received">Receberam (entregue/lido)</SelectItem>
                    <SelectItem value="sent_unconfirmed">Só aceito (sem entrega Meta)</SelectItem>
                    <SelectItem value="not_sent">Ainda não enviados</SelectItem>
                    <SelectItem value="survey_in_progress">Em andamento</SelectItem>
                    <SelectItem value="ready_questions">Prontos p/ perguntas</SelectItem>
                    <SelectItem value="needs_oi">Pedir oi (sem janela 24h)</SelectItem>
                    <SelectItem value="survey_done">Pesquisa concluída</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="responded">Quem respondeu</SelectItem>
                    <SelectItem value="not_responded">Quem não respondeu</SelectItem>
                  </>
                )}
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
                      {isSurveyCampaign && (
                        <TableHead className="w-[44px]">
                          <Checkbox
                            checked={
                              pagedRecipients.some((row) => row.readyForQuestions) &&
                              pagedRecipients
                                .filter((row) => row.readyForQuestions)
                                .every((row) => selectedContactIds.includes(row.contactId))
                            }
                            disabled={
                              send.isPending ||
                              !pagedRecipients.some((row) => row.readyForQuestions)
                            }
                            onCheckedChange={(value) =>
                              toggleSelectAllReadyOnPage(value === true)
                            }
                            aria-label="Selecionar prontos nesta página"
                          />
                        </TableHead>
                      )}
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Envio</TableHead>
                      <TableHead>Resposta</TableHead>
                      <TableHead>Motivo da falha</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead className="w-[72px]">Cadastro</TableHead>
                      {isSurveyCampaign && (
                        <TableHead className="w-[100px]">Perguntas</TableHead>
                      )}
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
                        {isSurveyCampaign && (
                          <TableCell>
                            <Checkbox
                              checked={selectedContactIds.includes(row.contactId)}
                              disabled={!row.readyForQuestions || send.isPending}
                              onCheckedChange={(value) =>
                                toggleSelectedContact(row.contactId, value === true)
                              }
                              aria-label={`Selecionar ${row.name}`}
                            />
                          </TableCell>
                        )}
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
                                : row.needsOi
                                  ? "Pedir oi"
                                  : row.readyForQuestions
                                    ? "Pronto p/ perguntas"
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
                        <TableCell>
                          <Button asChild size="sm" variant="outline" className="min-h-[36px] px-2">
                            <Link
                              to={`/admin/contatos/${row.contactId}`}
                              title="Abrir cadastro do cliente"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Abrir cadastro</span>
                            </Link>
                          </Button>
                        </TableCell>
                        {isSurveyCampaign && (
                          <TableCell>
                            {row.readyForQuestions ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="min-h-[36px]"
                                disabled={send.isPending}
                                onClick={() => void handleStartSurveyForContact(row.contactId)}
                              >
                                {sendingContactId === row.contactId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Enviar"
                                )}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )}
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
        campaign={campaign}
        contactCount={recipients?.length ?? queueContactCount ?? 0}
        onConfirm={handleSend}
        isSending={send.isPending}
      />
    </AdminPageShell>
  );
}
