import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { WhatsappDevBanner } from "@/components/admin/whatsapp/WhatsappDevBanner";
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
import { cn } from "@/lib/utils";

function MessagesSkeleton() {
  return (
    <div className="space-y-3">
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
      const result = await send.mutateAsync({
        conversation_id: id,
        action: "text",
        body_text: text.trim(),
      });
      toast.success(result.dry_run ? "Mensagem simulada (dry-run)." : "Mensagem enviada!");
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar.");
    }
  }

  async function handleMarkAttended() {
    if (!id) {
      return;
    }
    try {
      await closeConversation.mutateAsync(id);
      toast.success("Conversa marcada como atendida.");
    } catch {
      toast.error("Não foi possível atualizar a conversa.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[60vh]">
      <Link
        to="/admin/conversas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às conversas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <h1 className="text-xl font-bold">{title}</h1>
        {conversation?.status !== "closed" && (
          <Button
            size="sm"
            variant="outline"
            disabled={closeConversation.isPending}
            onClick={() => void handleMarkAttended()}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Marcar atendida
          </Button>
        )}
      </div>

      {conversation && (
        <p className="text-sm text-muted-foreground mb-2">{formatPhoneDisplay(conversation.wa_id)}</p>
      )}

      {conversation?.contact_removed_at && (
        <Badge variant="outline" className="mb-4 w-fit">
          Removido da base
        </Badge>
      )}

      <WhatsappDevBanner />

      <ServiceWindowBanner
        lastInboundAt={conversation?.last_inbound_at}
        isLoading={windowLoading}
      />

      <div className="flex-1 space-y-3 py-4 overflow-y-auto">
        {isLoading && <MessagesSkeleton />}

        {error && (
          <Card className="border-destructive/30">
            <CardContent className="pt-6 text-sm text-destructive">
              Não foi possível carregar as mensagens.
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
                    ? "bg-background border border-border text-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <p>{msg.body_text ?? `[${msg.message_type}]`}</p>
                <div className={cn("mt-1 flex items-center gap-2 text-[10px] opacity-70", !isInbound && "justify-end")}>
                  <span>{new Date(msg.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-current/30">
                    {msg.status}
                  </Badge>
                  {msg.meta_message_id?.startsWith("dry_run_") && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">simulado</Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {id && (
        <div className="sticky bottom-0 border-t bg-background pt-4 pb-2 mt-auto">
          {windowOpen ? (
            <div className="flex gap-2">
              <Textarea
                placeholder="Digite sua resposta..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                className="resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendText();
                  }
                }}
              />
              <Button
                className="shrink-0 self-end"
                disabled={!text.trim() || send.isPending}
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
        </div>
      )}
    </div>
  );
}
