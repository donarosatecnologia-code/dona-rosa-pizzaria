import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import {
  useDismissWhatsappNotifications,
  useMarkNotificationsRead,
  useWhatsappNotifications,
  useWhatsappNotificationsRealtime,
  useWhatsappUnreadCount,
} from "@/hooks/whatsapp/useWhatsappNotifications";
import { formatRelativeTime } from "@/lib/format-phone";
import { cn } from "@/lib/utils";

export function WhatsappNotificationBell() {
  const [open, setOpen] = useState(false);
  useWhatsappNotificationsRealtime();
  const { data: notifications, isLoading } = useWhatsappNotifications();
  const unreadCount = useWhatsappUnreadCount();
  const markRead = useMarkNotificationsRead();
  const dismiss = useDismissWhatsappNotifications();

  async function handleMarkAllRead() {
    try {
      await markRead.mutateAsync(undefined);
      toast.success("Todas marcadas como lidas.");
    } catch {
      toast.error("Não deu para marcar. Tente de novo.");
    }
  }

  async function handleDismissAll() {
    try {
      await dismiss.mutateAsync(undefined);
      toast.success("Notificações removidas.");
    } catch {
      toast.error("Não deu para excluir. Tente de novo.");
    }
  }

  async function handleMarkOne(id: string) {
    try {
      await markRead.mutateAsync([id]);
    } catch {
      toast.error("Não deu para marcar como lida.");
    }
  }

  async function handleDismissOne(id: string) {
    try {
      await dismiss.mutateAsync([id]);
    } catch {
      toast.error("Não deu para excluir.");
    }
  }

  const hasNotifications = (notifications?.length ?? 0) > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0 h-11 w-11" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button.absolute]:hidden">
        <SheetDescription className="sr-only">
          Lista de avisos do painel. Marque como lidas ou exclua individualmente.
        </SheetDescription>
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
          <SheetTitle className="text-lg font-semibold">Notificações</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Fechar">
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </div>

        {hasNotifications && (
          <div className="flex flex-wrap gap-2 border-b px-4 py-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              disabled={markRead.isPending || unreadCount === 0}
              onClick={() => void handleMarkAllRead()}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Marcar todas como lidas
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-destructive hover:text-destructive"
              disabled={dismiss.isPending}
              onClick={() => void handleDismissAll()}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Excluir todas
            </Button>
          </div>
        )}

        <AppScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-2">
            {isLoading && (
              <p className="text-sm text-muted-foreground py-4">Carregando...</p>
            )}
            {!isLoading && !hasNotifications && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma notificação por enquanto.
              </p>
            )}
            {notifications?.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "rounded-lg border p-3 text-sm",
                  n.is_read ? "bg-background" : "bg-primary/5 border-primary/20",
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {n.href ? (
                      <Link
                        to={n.href}
                        className="block hover:opacity-80"
                        onClick={() => setOpen(false)}
                      >
                        <NotificationContent notification={n} />
                      </Link>
                    ) : (
                      <NotificationContent notification={n} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!n.is_read && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        aria-label="Marcar como lida"
                        onClick={() => void handleMarkOne(n.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      aria-label="Excluir notificação"
                      onClick={() => void handleDismissOne(n.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function NotificationContent({
  notification,
}: {
  notification: { title: string; body: string | null; created_at: string };
}) {
  return (
    <>
      <p className="font-medium">{notification.title}</p>
      {notification.body && (
        <p className="text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">
        {formatRelativeTime(notification.created_at)}
      </p>
    </>
  );
}
