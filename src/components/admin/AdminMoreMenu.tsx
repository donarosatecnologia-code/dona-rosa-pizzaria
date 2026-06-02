import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ADMIN_MORE_NAV, ADMIN_SIGN_OUT, isAdminNavActive } from "@/lib/adminNavigation";
import { useFilteredAdminNav } from "@/hooks/useFilteredAdminNav";
import { cn } from "@/lib/utils";

interface AdminMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}

export function AdminMoreMenu({ open, onOpenChange, pathname }: AdminMoreMenuProps) {
  const { signOut } = useAuth();
  const moreNav = useFilteredAdminNav(ADMIN_MORE_NAV);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle>Mais opções</SheetTitle>
          <SheetDescription>Clientes, promoções, site e ajustes.</SheetDescription>
        </SheetHeader>
        <nav className="mt-4 grid gap-1">
          {moreNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm min-h-[44px]",
                isAdminNavActive(pathname, item)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              void signOut();
            }}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-muted min-h-[44px] w-full text-left"
          >
            <ADMIN_SIGN_OUT.icon className="h-5 w-5 shrink-0" aria-hidden />
            {ADMIN_SIGN_OUT.label}
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
