import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  UtensilsCrossed,
  FileStack,
  Rows3,
} from "lucide-react";
import { useState } from "react";
import logoBranco from "@/assets/logo-branco.png";
import { AdminEditToolbar } from "@/components/AdminEditToolbar";
import AdminEditorSidebar from "@/components/AdminEditorSidebar";
import { useAdminEditor } from "@/contexts/AdminEditorContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/pages", label: "Páginas", icon: FileStack },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/header-footer", label: "Header & Footer", icon: Rows3 },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const { isEditing } = useAdminEditor();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-workspace flex min-h-screen bg-muted">
      <aside
        className={`${
          sidebarCollapsed ? "w-16" : "w-60"
        } relative z-[100] bg-foreground text-primary-foreground flex flex-col shrink-0 transition-all duration-300 sticky top-0 h-screen`}
      >
        <div className="p-4 border-b border-primary-foreground/20 flex items-center justify-between gap-2">
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <img src={logoBranco} alt="Dona Rosa" className="h-10 w-auto max-w-[9rem] object-contain object-left" />
              <p className="text-xs opacity-60 mt-1">Painel administrativo</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-primary-foreground/70 hover:text-primary-foreground p-1 shrink-0"
            aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-primary-foreground/70 hover:bg-primary-foreground/10"
                } ${sidebarCollapsed ? "justify-center" : ""}`
              }
            >
              <item.icon size={18} />
              {!sidebarCollapsed && item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-primary-foreground/20 space-y-2">
          {!sidebarCollapsed && (
            <p className="text-xs text-primary-foreground/50 px-1 leading-relaxed">
              Edite no espelho da página (Páginas) ou em Header &amp; Footer. Salve rascunho e publique na barra superior.
            </p>
          )}

          <button
            type="button"
            onClick={signOut}
            title="Sair"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary-foreground/70 hover:bg-primary-foreground/10 w-full ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && "Sair"}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "admin-main-column flex min-h-0 min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out",
          isEditing && "pr-[min(380px,90vw)]",
        )}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          <div className="relative z-[130] mb-4 shrink-0 border-b border-border bg-muted/90 px-4 py-3 backdrop-blur-md -mx-6 -mt-6">
            <AdminEditToolbar />
          </div>
          <div className="admin-outlet-scroll relative z-0 min-h-0 flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <AdminEditorSidebar />
    </div>
  );
};

export default AdminLayout;
