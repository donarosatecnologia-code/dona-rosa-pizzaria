import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Download, Send, Loader2 } from "lucide-react";
import { BroadcastSendConfirmDialog } from "@/components/admin/disparos/BroadcastSendConfirmDialog";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useWhatsappContacts,
} from "@/hooks/whatsapp";
import { useQueueContactCount } from "@/hooks/whatsapp/useQueueContactCount";
import { buildBroadcastResponsesCsv, downloadCsvFile } from "@/lib/whatsapp/exportBroadcastCsv";
import { buildSurveyResultsCsv } from "@/lib/whatsapp/exportSurveyCsv";
import type { SurveyStep } from "@/integrations/supabase/types/survey-flows";
import { maskPhone } from "@/lib/whatsapp/normalizePhone";

const CHART_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#dc2626", "#9333ea"];

export default function AdminDisparoDetail() {
  const { id } = useParams<{ id: string }>();
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  useWhatsappBroadcastRealtime();

  const { data: campaigns } = useBroadcastCampaigns();
  const campaign = campaigns?.find((c) => c.id === id);
  const { data: recipients, isLoading: loadingRecipients } = useBroadcastCampaignRecipients(id);
  const { data: responses, isLoading: loadingResponses } = useBroadcastResponses(id);
  const { data: surveySessions, isLoading: loadingSurvey } = useSurveyCampaignResults(id);
  const { data: surveyFlows } = useSurveyFlows();
  const { data: contacts } = useWhatsappContacts();
  const send = useBroadcastSend();
  const { data: queueContactCount, isLoading: loadingQueueCount } = useQueueContactCount(
    campaign?.queue_id ?? campaign?.queue_id_draft,
  );

  const contactById = new Map(contacts?.map((c) => [c.id, c]) ?? []);
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
  const isSurveyCampaign = (campaign?.content_type ?? campaign?.content_type_draft) === "survey" && surveySteps.length > 0;

  const completedSurveys = (surveySessions ?? []).filter((s) => s.status === "completed").length;
  const responseCount = isSurveyCampaign ? completedSurveys : (responses?.length ?? 0);

  const responseRate =
    campaign && campaign.total_delivered > 0
      ? Math.round((responseCount / campaign.total_delivered) * 100)
      : 0;

  async function handleSend() {
    if (!id) {
      return;
    }
    try {
      const result = await send.mutateAsync({ campaign_id: id });
      toast.success(`${result.sent} mensagem(ns) enviada(s).`);
      setConfirmSendOpen(false);
    } catch {
      toast.error("Disparo falhou.");
    }
  }

  function handleExportCsv() {
    if (isSurveyCampaign) {
      if (!surveySessions?.length) {
        toast.error("Não há respostas para exportar.");
        return;
      }
      const csv = buildSurveyResultsCsv(surveySessions, contactById, campaignLabel, surveySteps);
      const safeName = campaignLabel.replace(/[^\w-]+/g, "_").slice(0, 40);
      downloadCsvFile(`pesquisa_${safeName}_${id?.slice(0, 8)}.csv`, csv);
      toast.success("CSV exportado.");
      return;
    }

    if (!responses?.length) {
      toast.error("Não há respostas para exportar.");
      return;
    }
    const csv = buildBroadcastResponsesCsv(responses, contactById, campaignLabel);
    const safeName = campaignLabel.replace(/[^\w-]+/g, "_").slice(0, 40);
    downloadCsvFile(`respostas_${safeName}_${id?.slice(0, 8)}.csv`, csv);
    toast.success("CSV exportado.");
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
    <div className="max-w-4xl mx-auto">
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
                Disparar
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

      {isSurveyCampaign && surveySteps.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Respostas por pergunta — {surveyFlow?.name}</CardTitle>
            {surveySessions && surveySessions.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-1" />
                Exportar CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingSurvey && <Skeleton className="h-24 w-full" />}
            {!loadingSurvey && (!surveySessions || surveySessions.length === 0) && (
              <p className="text-sm text-muted-foreground">Aguardando respostas dos clientes...</p>
            )}
            {surveySessions && surveySessions.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      {surveySteps.map((step, index) => (
                        <TableHead key={step.id} className="min-w-[120px]">
                          {index + 1}. {step.question.slice(0, 40)}
                          {step.question.length > 40 ? "…" : ""}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surveySessions.map((session) => {
                      const contact = contactById.get(session.contact_id);
                      const answerByStep = new Map(session.answers.map((a) => [a.step_index, a]));
                      return (
                        <TableRow key={session.id}>
                          <TableCell>{contact ? maskPhone(contact.phone_number) : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={session.status === "completed" ? "outline" : "secondary"}>
                              {session.status === "completed" ? "Concluída" : "Em andamento"}
                            </Badge>
                          </TableCell>
                          {surveySteps.map((_, index) => {
                            const answer = answerByStep.get(index);
                            return (
                              <TableCell key={index} className="text-xs">
                                {answer?.response_label ?? answer?.response_value ?? "—"}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isSurveyCampaign && chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Resultados da pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Destinatários</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecipients && <Skeleton className="h-24 w-full" />}
          {!loadingRecipients && (!recipients || recipients.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhum destinatário ainda. Dispare a campanha para popular.</p>
          )}
          {recipients && recipients.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Enviado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((r) => {
                    const contact = contactById.get(r.contact_id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          {contact ? maskPhone(contact.phone_number) : r.contact_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={r.send_status === "failed" ? "destructive" : "outline"}
                          >
                            {r.send_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                          {r.send_status === "failed" && r.failure_reason
                            ? r.failure_reason
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.sent_at ? new Date(r.sent_at).toLocaleString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Respostas recebidas</CardTitle>
          {!isSurveyCampaign && responses && responses.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingResponses && <Skeleton className="h-24 w-full" />}
          {!isSurveyCampaign && !loadingResponses && (!responses || responses.length === 0) && (
            <p className="text-sm text-muted-foreground">Aguardando respostas dos clientes...</p>
          )}
          {isSurveyCampaign && (
            <p className="text-sm text-muted-foreground">
              Pesquisa sequencial — veja o quadro &quot;Respostas por pergunta&quot; acima.
            </p>
          )}
          {!isSurveyCampaign && responses && responses.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Resposta</TableHead>
                    <TableHead>Horário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((r) => {
                    const contact = contactById.get(r.contact_id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{contact ? maskPhone(contact.phone_number) : "—"}</TableCell>
                        <TableCell>{r.response_value}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(r.received_at).toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
