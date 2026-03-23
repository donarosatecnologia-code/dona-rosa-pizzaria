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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar Nav */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-56"} bg-foreground text-primary-foreground flex flex-col shrink-0 transition-all duration-300`}>
        <div className="p-4 border-b border-primary-foreground/20 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <img src={logoSmall} alt="Dona Rosa" className="h-10 brightness-0 invert" />
              <p className="text-xs opacity-60 mt-1">Painel Admin</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-primary-foreground/70 hover:text-primary-foreground p-1">
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
            <p className="text-xs text-primary-foreground/50 px-3 mb-2">
              💡 Para editar o site, visite as páginas públicas estando logado. Ícones de lápis aparecerão ao passar o mouse.
            </p>
          )}
          {!sidebarCollapsed && (
            <a href="/" target="_blank" className="block text-xs text-primary-foreground/50 hover:text-primary-foreground/80 mb-2 px-3">
              ↗ Ver site (modo editor)
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
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
