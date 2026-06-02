import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FileText,
  FolderOpen,
  MessageCircle,
  Package,
  Send,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const CHART_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#9333ea", "#dc2626"];

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  accent?: string;
}) {
  const content = (
    <Card className={href ? "hover:border-primary/40 transition-colors" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-5 w-5 ${accent ?? "text-primary"}`} />
        </div>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}

const Dashboard = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Início</h1>
        <p className="text-sm text-destructive">Não deu para carregar o resumo. Tente de novo.</p>
      </div>
    );
  }

  const messagesChart = stats.messages_by_day ?? [];
  const statusChart = stats.conversations_by_status ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Início</h1>
        <p className="text-sm text-muted-foreground">
          Resumo rápido do site, mensagens e promoções.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Aguardando resposta"
          value={stats.conversations_waiting}
          icon={MessageCircle}
          href="/admin/conversas"
          accent="text-amber-600"
        />
        <StatCard
          label="Conversas abertas"
          value={stats.conversations_open}
          icon={MessageCircle}
          href="/admin/conversas"
        />
        <StatCard
          label="Clientes"
          value={stats.contacts_count}
          icon={Users}
          href="/admin/contatos"
        />
        <StatCard
          label="Templates aprovados"
          value={stats.templates_approved}
          icon={Send}
          href="/admin/templates"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Produtos" value={stats.products_count} icon={Package} href="/admin/cardapio" />
        <StatCard label="Categorias" value={stats.categories_count} icon={FolderOpen} href="/admin/cardapio" />
        <StatCard label="Conteúdos CMS" value={stats.contents_count} icon={FileText} href="/admin/pages" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mensagens — últimos 7 dias</CardTitle>
            <CardDescription>Recebidas vs enviadas</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {messagesChart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">Sem mensagens no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={messagesChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="inbound" name="Recebidas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound" name="Enviadas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversas por status</CardTitle>
            <CardDescription>Visão geral da fila</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {statusChart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">Nenhuma conversa ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChart.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Últimas promoções</CardTitle>
            <CardDescription>Campanhas recentes de disparo</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="min-h-[44px]" asChild>
            <Link to="/admin/disparos">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(stats.campaigns_summary ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
          ) : (
            <div className="space-y-2">
              {stats.campaigns_summary.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/admin/disparos/${campaign.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{campaign.status}</p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>{campaign.total_sent} enviadas</p>
                    <p>{campaign.total_delivered} entregues</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {stats.conversations_waiting > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-amber-950">
                {stats.conversations_waiting} cliente(s) aguardando resposta
              </p>
              <p className="text-sm text-amber-900/80">Atenda pela aba Mensagens.</p>
            </div>
            <Button asChild className="min-h-[44px]">
              <Link to="/admin/conversas">
                <MessageCircle className="h-4 w-4 mr-2" />
                Ir para mensagens
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
