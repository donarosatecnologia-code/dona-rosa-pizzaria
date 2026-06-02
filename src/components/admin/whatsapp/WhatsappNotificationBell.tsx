import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useMarkNotificationsRead,
  useWhatsappNotifications,
  useWhatsappNotificationsRealtime,
  useWhatsappUnreadCount,
} from "@/hooks/whatsapp/useWhatsappNotifications";
import { formatRelativeTime } from "@/lib/format-phone";

export function WhatsappNotificationBell() {
  const [open, setOpen] = useState(false);
  useWhatsappNotificationsRealtime();
  const { data: notifications, isLoading } = useWhatsappNotifications();
  const unreadCount = useWhatsappUnreadCount();
  const markRead = useMarkNotificationsRead();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) {
      markRead.mutate(undefined);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="Notificações">
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
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
          <SheetDescription>
            Mensagens recebidas, modelos e campanhas.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {isLoading && (
            <p className="text-sm text-muted-foreground py-4">Carregando...</p>
          )}
          {!isLoading && (!notifications || notifications.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma notificação ainda.
            </p>
          )}
          {notifications?.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-3 text-sm ${n.is_read ? "bg-background" : "bg-primary/5 border-primary/20"}`}
            >
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
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotificationContent({
  notification,
}: {
  notification: { title: string; body: string | null; created_at: string; event_type: string };
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
