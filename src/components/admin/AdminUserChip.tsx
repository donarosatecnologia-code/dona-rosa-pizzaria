import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AdminUserChipProps {
  variant?: "dark" | "light";
  className?: string;
}

function getFallbackName(email: string | undefined): string {
  if (!email) {
    return "Usuário";
  }
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
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
  const { data: profile, isLoading } = useAdminProfile();
  const displayName = profile?.full_name?.trim() || getFallbackName(user?.email);
  const initials = isLoading ? "…" : getInitials(displayName);

  return (
    <Link
      to="/admin/minha-conta"
      className={cn(
        "flex items-center gap-2 min-h-[44px] max-w-[9rem] sm:max-w-[12rem] rounded-lg hover:opacity-90 transition-opacity",
        className,
      )}
      title={`${displayName} — Minha conta`}
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
    </Link>
  );
}
