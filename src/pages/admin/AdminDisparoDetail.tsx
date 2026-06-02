import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
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
  useWhatsappBroadcastRealtime,
  useWhatsappContacts,
} from "@/hooks/whatsapp";
import { maskPhone } from "@/lib/whatsapp/normalizePhone";

const CHART_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#dc2626", "#9333ea"];

export default function AdminDisparoDetail() {
  const { id } = useParams<{ id: string }>();
  useWhatsappBroadcastRealtime();

  const { data: campaigns } = useBroadcastCampaigns();
  const campaign = campaigns?.find((c) => c.id === id);
  const { data: recipients, isLoading: loadingRecipients } = useBroadcastCampaignRecipients(id);
  const { data: responses, isLoading: loadingResponses } = useBroadcastResponses(id);
  const { data: contacts } = useWhatsappContacts();
  const send = useBroadcastSend();

  const contactById = new Map(contacts?.map((c) => [c.id, c]) ?? []);

  const responseDistribution = (responses ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.response_value] = (acc[r.response_value] ?? 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(responseDistribution).map(([name, value]) => ({ name, value }));

  const responseRate =
    campaign && campaign.total_delivered > 0
      ? Math.round(((responses?.length ?? 0) / campaign.total_delivered) * 100)
      : 0;

  async function handleSend() {
    if (!id) {
      return;
    }
    try {
      const result = await send.mutateAsync({ campaign_id: id });
      toast.success(`${result.sent} mensagem(ns) enviada(s).`);
    } catch {
      toast.error("Disparo falhou.");
    }
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
          <Button size="sm" disabled={send.isPending} onClick={handleSend}>
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
          { label: "Respostas", value: responses?.length ?? 0 },
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

      {chartData.length > 0 && (
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
                          <Badge variant="outline">{r.send_status}</Badge>
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
        <CardHeader>
          <CardTitle className="text-base">Respostas recebidas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingResponses && <Skeleton className="h-24 w-full" />}
          {!loadingResponses && (!responses || responses.length === 0) && (
            <p className="text-sm text-muted-foreground">Aguardando respostas dos clientes...</p>
          )}
          {responses && responses.length > 0 && (
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
    </div>
  );
}
