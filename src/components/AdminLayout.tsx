import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import logoBranco from "@/assets/logo-branco.png";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { AdminDesktopTopBar } from "@/components/admin/AdminDesktopTopBar";
import { AdminMobileDrawer } from "@/components/admin/AdminMobileDrawer";
import { AdminMoreMenu } from "@/components/admin/AdminMoreMenu";
import AdminEditorSidebar from "@/components/AdminEditorSidebar";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import { useAdminEditor } from "@/contexts/AdminEditorContext";
import { useAdminShellRoutes } from "@/hooks/useAdminShellRoutes";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_DESKTOP_NAV, ADMIN_SIGN_OUT, isAdminNavActive } from "@/lib/adminNavigation";
import { useFilteredAdminNav } from "@/hooks/useFilteredAdminNav";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
  const { signOut } = useAuth();
  const { isEditing } = useAdminEditor();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname, hideBottomNav, hideMobileHeader, fullBleedMobile } = useAdminShellRoutes();
  const desktopNav = useFilteredAdminNav(ADMIN_DESKTOP_NAV);

  return (
    <div className="admin-workspace flex min-h-[100dvh] bg-muted">
      <aside
        className={cn(
          "relative z-[100] bg-foreground text-primary-foreground flex-col shrink-0 transition-all duration-300 sticky top-0 h-screen",
          "hidden lg:flex",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        <div className="p-4 border-b border-primary-foreground/20 flex items-center justify-between gap-2">
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <img src={logoBranco} alt="Dona Rosa" className="h-10 w-auto max-w-[9rem] object-contain object-left" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-primary-foreground/70 hover:text-primary-foreground p-2.5 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <AppScrollArea className="flex-1 min-h-0">
          <nav className="p-3 space-y-1">
          {desktopNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px]",
                  isActive || isAdminNavActive(pathname, item)
                    ? "bg-primary text-primary-foreground"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10",
                  sidebarCollapsed && "justify-center px-2",
                )
              }
            >
              <item.icon size={18} />
              {!sidebarCollapsed && item.label}
            </NavLink>
          ))}
          </nav>
        </AppScrollArea>

        <div className="p-3 border-t border-primary-foreground/20">
          <button
            type="button"
            onClick={() => void signOut()}
            title={ADMIN_SIGN_OUT.label}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary-foreground/70 hover:bg-primary-foreground/10 w-full min-h-[44px]",
              sidebarCollapsed && "justify-center",
            )}
          >
            <ADMIN_SIGN_OUT.icon size={18} />
            {!sidebarCollapsed && ADMIN_SIGN_OUT.label}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "admin-main-column flex min-h-0 min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out",
          isEditing && "lg:pr-[min(380px,90vw)]",
        )}
      >
        {!hideMobileHeader && (
          <AdminMobileHeader onMenuClick={() => setDrawerOpen(true)} />
        )}

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            fullBleedMobile ? "p-0 pt-14 lg:p-6 lg:pt-6" : "p-4 pt-[calc(3.5rem+1rem)] lg:p-6 lg:pt-6",
            !hideBottomNav && "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-6",
            hideMobileHeader && fullBleedMobile && "pt-0 lg:pt-6",
          )}
        >
          <AdminDesktopTopBar />

          <div
            className={cn(
              "admin-outlet-scroll relative z-0 min-h-0 flex-1",
              fullBleedMobile && "overflow-hidden",
            )}
          >
            {fullBleedMobile ? (
              <Outlet />
            ) : (
              <AppScrollArea className="h-full">
                <Outlet />
              </AppScrollArea>
            )}
          </div>
        </main>
      </div>

      {!hideBottomNav && (
        <AdminBottomNav onMoreClick={() => setMoreOpen(true)} />
      )}

      <AdminMobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} pathname={pathname} />
      <AdminMoreMenu open={moreOpen} onOpenChange={setMoreOpen} pathname={pathname} />
      <AdminEditorSidebar />
    </div>
  );
};

export default AdminLayout;
