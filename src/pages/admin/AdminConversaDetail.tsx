import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { ServiceWindowBanner } from "@/components/admin/whatsapp/ServiceWindowBanner";
import { SendTemplateSheet } from "@/components/admin/whatsapp/SendTemplateSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useWhatsappConversations,
  useWhatsappCrmRealtime,
  useWhatsappMessages,
  useSendWhatsappMessage,
  useCloseWhatsappConversation,
  useServiceWindowOpen,
} from "@/hooks/whatsapp";
import { formatPhoneDisplay } from "@/lib/format-phone";
import { toAdminUserMessage } from "@/lib/adminUserMessage";
import { cn } from "@/lib/utils";
import { AppScrollArea } from "@/components/ui/app-scroll-area";

function MessagesSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 4].map((i) => (
        <Skeleton key={i} className={`h-12 w-2/3 rounded-2xl ${i % 2 === 0 ? "ml-auto" : ""}`} />
      ))}
    </div>
  );
}

export default function AdminConversaDetail() {
  const { id } = useParams<{ id: string }>();
  const [text, setText] = useState("");
  useWhatsappCrmRealtime();

  const { data: conversations } = useWhatsappConversations();
  const conversation = conversations?.find((c) => c.id === id);

  const { data: messages, isLoading, error } = useWhatsappMessages(id);
  const { data: windowOpen, isLoading: windowLoading } = useServiceWindowOpen(id);
  const send = useSendWhatsappMessage();
  const closeConversation = useCloseWhatsappConversation();

  const title = conversation?.contact_name ?? (conversation ? formatPhoneDisplay(conversation.wa_id) : "Conversa");

  async function handleSendText() {
    if (!id || !text.trim()) {
      return;
    }
    try {
      await send.mutateAsync({
        conversation_id: id,
        action: "text",
        body_text: text.trim(),
      });
      toast.success("Enviou!");
      setText("");
    } catch (err) {
      toast.error(toAdminUserMessage(err instanceof Error ? err.message : undefined));
    }
  }

  async function handleMarkAttended() {
    if (!id) {
      return;
    }
    try {
      await closeConversation.mutateAsync(id);
      toast.success("Pronto, atendido!");
    } catch {
      toast.error("Não deu para atualizar. Tente de novo.");
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] lg:h-auto lg:max-w-2xl lg:mx-auto lg:min-h-[60vh] bg-background">
      <header className="shrink-0 border-b bg-background px-3 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" asChild>
          <Link to="/admin/conversas" aria-label="Voltar para mensagens">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold truncate">{title}</h1>
          {conversation && (
            <p className="text-xs text-muted-foreground truncate">{formatPhoneDisplay(conversation.wa_id)}</p>
          )}
        </div>
        {conversation?.status !== "closed" && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 min-h-[44px]"
            disabled={closeConversation.isPending}
            onClick={() => void handleMarkAttended()}
          >
            <CheckCircle2 className="h-4 w-4 mr-1 shrink-0" />
            <span className="hidden sm:inline">Pronto, atendido</span>
            <span className="sm:hidden">Atendido</span>
          </Button>
        )}
      </header>

      {conversation?.contact_removed_at && (
        <div className="px-4 pt-2">
          <Badge variant="outline">Saiu da lista</Badge>
        </div>
      )}

      <div className="px-4 pt-2 shrink-0">
        <ServiceWindowBanner
          lastInboundAt={conversation?.last_inbound_at}
          isLoading={windowLoading}
        />
      </div>

      <AppScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-3 space-y-3">
        {isLoading && <MessagesSkeleton />}

        {error && (
          <Card className="border-destructive/30">
            <CardContent className="pt-6 text-sm text-destructive">
              Não deu para carregar as mensagens. Tente de novo.
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (!messages || messages.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem nesta conversa.</p>
        )}

        {messages?.map((msg) => {
          const isInbound = msg.direction === "inbound";
          return (
            <div
              key={msg.id}
              className={cn("flex", isInbound ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  isInbound
                    ? "bg-muted border border-border text-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <p>{msg.body_text ?? `[${msg.message_type}]`}</p>
                <p className={cn("mt-1 text-[10px] opacity-70", !isInbound && "text-right")}>
                  {new Date(msg.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                </p>
              </div>
            </div>
          );
        })}
        </div>
      </AppScrollArea>

      {id && (
        <footer className="shrink-0 border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {windowOpen ? (
            <div className="flex gap-2 items-end">
              <Textarea
                placeholder="Escreva aqui..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                className="resize-none text-sm min-h-[44px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendText();
                  }
                }}
              />
              <Button
                className="shrink-0 h-11 w-11"
                disabled={!text.trim() || send.isPending}
                aria-label="Enviar mensagem"
                onClick={() => void handleSendText()}
              >
                {send.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <SendTemplateSheet conversationId={id} />
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
