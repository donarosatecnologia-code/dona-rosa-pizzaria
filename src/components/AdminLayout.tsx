import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, FileText, UtensilsCrossed, Settings, LogOut, LayoutDashboard, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import logoSmall from "@/assets/logo-small.png";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/home", label: "Homepage", icon: Home },
  { to: "/admin/quem-somos", label: "Quem Somos", icon: FileText },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if current route is an editable page (not dashboard/cardapio/configuracoes)
  const isEditablePage = ["/admin/home", "/admin/quem-somos"].includes(location.pathname);

  // Map admin routes to their public preview URLs
  const previewUrlMap: Record<string, string> = {
    "/admin/home": "/",
    "/admin/quem-somos": "/quem-somos",
  };
  const previewUrl = previewUrlMap[location.pathname];

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-foreground text-primary-foreground flex flex-col shrink-0 transition-all duration-300`}>
        <div className="p-4 border-b border-primary-foreground/20 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <img src={logoSmall} alt="Dona Rosa" className="h-10 brightness-0 invert" />
              <p className="text-xs opacity-60 mt-1">Painel Administrativo</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-primary-foreground/70 hover:text-primary-foreground p-1"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
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
        <div className="p-3 border-t border-primary-foreground/20">
          {!sidebarCollapsed && (
            <a href="/" target="_blank" className="block text-xs text-primary-foreground/50 hover:text-primary-foreground/80 mb-2 px-3">
              ↗ Ver site
            </a>
          )}
          <button
            onClick={signOut}
            title="Sair"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary-foreground/70 hover:bg-primary-foreground/10 w-full ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && "Sair"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      {isEditablePage ? (
        <div className="flex-1 flex">
          {/* Editor panel */}
          <div className="w-[400px] shrink-0 bg-background border-r border-border overflow-auto">
            <div className="p-6">
              <Outlet />
            </div>
          </div>
          {/* Live Preview */}
          <div className="flex-1 bg-muted overflow-auto relative">
            <div className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">Preview ao vivo</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <iframe
              src={previewUrl}
              className="w-full h-[calc(100vh-41px)] border-none"
              title="Preview"
            />
          </div>
        </div>
      ) : (
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default AdminLayout;
