import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import { ADMIN_DESKTOP_NAV, ADMIN_SIGN_OUT, isAdminNavActive } from "@/lib/adminNavigation";
import { useFilteredAdminNav } from "@/hooks/useFilteredAdminNav";
import { cn } from "@/lib/utils";

interface AdminMobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}

export function AdminMobileDrawer({ open, onOpenChange, pathname }: AdminMobileDrawerProps) {
  const { signOut } = useAuth();
  const desktopNav = useFilteredAdminNav(ADMIN_DESKTOP_NAV);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[min(100vw-2rem,18rem)] flex-col p-0 bg-foreground text-primary-foreground border-none">
        <SheetHeader className="p-4 border-b border-primary-foreground/20 text-left shrink-0">
          <SheetTitle className="text-primary-foreground">Dona Rosa</SheetTitle>
          <SheetDescription className="text-primary-foreground/70">
            Painel administrativo
          </SheetDescription>
        </SheetHeader>
        <AppScrollArea className="flex-1 min-h-0">
          <nav className="p-3 space-y-1">
          {desktopNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-md text-sm min-h-[44px]",
                isAdminNavActive(pathname, item)
                  ? "bg-primary text-primary-foreground"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/10",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          ))}
          </nav>
        </AppScrollArea>
        <div className="p-3 border-t border-primary-foreground/20 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              void signOut();
            }}
            className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-primary-foreground/70 hover:bg-primary-foreground/10 w-full min-h-[44px]"
          >
            <ADMIN_SIGN_OUT.icon className="h-5 w-5" aria-hidden />
            {ADMIN_SIGN_OUT.label}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
