import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AdminUserChipProps {
  variant?: "dark" | "light";
  className?: string;
}

function getUserDisplayName(email: string | undefined, fullName: unknown): string {
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }
  if (email) {
    const local = email.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Usuário";
}

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

export function AdminUserChip({ variant = "light", className }: AdminUserChipProps) {
  const { user } = useAuth();
  const displayName = getUserDisplayName(user?.email, user?.user_metadata?.full_name);
  const initials = getInitials(displayName);

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-h-[44px] max-w-[9rem] sm:max-w-[12rem]",
        className,
      )}
      title={user?.email ?? displayName}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-medium",
            variant === "dark"
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "text-sm font-medium truncate hidden sm:inline",
          variant === "dark" ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {displayName}
      </span>
    </div>
  );
}
