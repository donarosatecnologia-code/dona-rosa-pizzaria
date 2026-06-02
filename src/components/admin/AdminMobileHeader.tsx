import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminHeaderActions } from "@/components/admin/AdminHeaderActions";
import { cn } from "@/lib/utils";

interface AdminMobileHeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function AdminMobileHeader({ onMenuClick, className }: AdminMobileHeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-[140] flex h-14 items-center gap-2 border-b border-border bg-foreground px-3 lg:hidden",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <p className="text-sm text-primary-foreground/90 truncate min-w-0 flex-1">
        Painel administrativo
      </p>
      <AdminHeaderActions variant="dark" />
    </header>
  );
}
