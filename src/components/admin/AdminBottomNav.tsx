import { NavLink, useLocation } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ADMIN_BOTTOM_NAV, isAdminNavActive } from "@/lib/adminNavigation";
import { useFilteredAdminNav } from "@/hooks/useFilteredAdminNav";
import { useWhatsappWaitingCount } from "@/hooks/useWhatsappWaitingCount";
import { cn } from "@/lib/utils";

interface AdminBottomNavProps {
  onMoreClick: () => void;
  className?: string;
}

export function AdminBottomNav({ onMoreClick, className }: AdminBottomNavProps) {
  const waitingCount = useWhatsappWaitingCount();
  const { pathname } = useLocation();
  const bottomNav = useFilteredAdminNav(ADMIN_BOTTOM_NAV);

  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-[140] border-t border-border bg-background/95 backdrop-blur-md lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label="Menu principal"
    >
      <div className="grid grid-cols-4 h-16">
        {bottomNav.map((item) => {
          const isMessages = item.to === "/admin/conversas";
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium min-h-[44px] relative",
                  isActive || isAdminNavActive(pathname, item)
                    ? "text-primary"
                    : "text-muted-foreground",
                )
              }
            >
              <span className="relative">
                <item.icon className="h-5 w-5" aria-hidden />
                {isMessages && waitingCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-3 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center"
                  >
                    {waitingCount > 9 ? "9+" : waitingCount}
                  </Badge>
                )}
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground min-h-[44px]"
          aria-label="Mais opções"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
          <span>Mais</span>
        </button>
      </div>
    </nav>
  );
}
