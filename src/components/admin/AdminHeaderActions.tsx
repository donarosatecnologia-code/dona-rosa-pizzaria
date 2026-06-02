import { WhatsappNotificationBell } from "@/components/admin/whatsapp/WhatsappNotificationBell";
import { AdminUserChip } from "@/components/admin/AdminUserChip";
import { cn } from "@/lib/utils";

interface AdminHeaderActionsProps {
  variant?: "dark" | "light";
  className?: string;
}

export function AdminHeaderActions({ variant = "light", className }: AdminHeaderActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 shrink-0",
        variant === "dark" && "[&_button]:text-primary-foreground [&_button:hover]:bg-primary-foreground/10",
        className,
      )}
    >
      <WhatsappNotificationBell />
      <AdminUserChip variant={variant} />
    </div>
  );
}
