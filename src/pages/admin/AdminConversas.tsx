import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ChevronRight, Clock } from "lucide-react";
import { WhatsappDevBanner } from "@/components/admin/whatsapp/WhatsappDevBanner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useWhatsappConversations,
  useWhatsappCrmRealtime,
  useWhatsappConnectionStatus,
  useWhatsappBusinessHours,
} from "@/hooks/whatsapp";
import { formatPhoneDisplay, formatRelativeTime } from "@/lib/format-phone";
import { isOutsideBusinessHours, isWaitingForReply } from "@/integrations/supabase/types/whatsapp-inbox";

type QueueTab = "waiting" | "all" | "closed";

function ConversasSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function AdminConversas() {
  useWhatsappCrmRealtime();
  const [tab, setTab] = useState<QueueTab>("waiting");
  const { data: connection } = useWhatsappConnectionStatus();
  const { data: businessHours } = useWhatsappBusinessHours();
  const { data: conversations, isLoading, error } = useWhatsappConversations();

  const outsideHours = businessHours ? isOutsideBusinessHours(businessHours) : false;

  const filtered = useMemo(() => {
    if (!conversations) {
      return [];
    }
    if (tab === "waiting") {
      return conversations.filter(isWaitingForReply);
    }
    if (tab === "closed") {
      return conversations.filter((c) => c.status === "closed");
    }
    return conversations;
  }, [conversations, tab]);

  const waitingCount = conversations?.filter(isWaitingForReply).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Conversas</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Fila de atendimento e histórico de mensagens WhatsApp.
      </p>

      <WhatsappDevBanner />

      {outsideHours && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Fora do horário de expediente — envio continua disponível.
        </div>
      )}

      {connection?.isConnected && (
        <p className="text-xs text-muted-foreground mb-4">
          Número conectado: {connection.config?.display_name ?? connection.config?.phone_number_id ?? "Meta"}
        </p>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as QueueTab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="waiting">
            Aguardando
            {waitingCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {waitingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="closed">Atendidas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <ConversasSkeleton />}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar as conversas. Tente novamente em instantes.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              {tab === "waiting" ? "Ninguém aguardando resposta" : "Nenhuma conversa nesta aba"}
            </p>
            <p>
              {tab === "waiting"
                ? "Quando alguém mandar mensagem, aparece aqui."
                : "Troque de aba para ver outras conversas."}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <ul className="space-y-2">
          {filtered.map((conv) => {
            const preview = [...(conv.whatsapp_messages ?? [])].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )[0];
            const waiting = isWaitingForReply(conv);
            return (
              <li key={conv.id}>
                <Link
                  to={`/admin/conversas/${conv.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 shadow-sm hover:bg-muted/40 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {(conv.contact_name ?? conv.wa_id).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{conv.contact_name ?? formatPhoneDisplay(conv.wa_id)}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {preview?.body_text ?? "Sem mensagens de texto"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {waiting && (
                        <Badge variant="default" className="text-xs">
                          Aguardando
                        </Badge>
                      )}
                      {conv.contact_removed_at && (
                        <Badge variant="outline" className="text-xs">
                          Removido da base
                        </Badge>
                      )}
                      {conv.status === "closed" && (
                        <Badge variant="secondary" className="text-xs">
                          Atendida
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
