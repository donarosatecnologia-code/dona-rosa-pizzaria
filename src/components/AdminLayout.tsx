import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, FileText, UtensilsCrossed, Settings, LogOut, LayoutDashboard } from "lucide-react";
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

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className="w-64 bg-foreground text-primary-foreground flex flex-col shrink-0">
        <div className="p-4 border-b border-primary-foreground/20">
          <img src={logoSmall} alt="Dona Rosa" className="h-10 brightness-0 invert" />
          <p className="text-xs opacity-60 mt-1">Painel Administrativo</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-primary-foreground/70 hover:bg-primary-foreground/10"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-primary-foreground/20">
          <a href="/" target="_blank" className="block text-xs text-primary-foreground/50 hover:text-primary-foreground/80 mb-2 px-3">
            ↗ Ver site
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary-foreground/70 hover:bg-primary-foreground/10 w-full"
          >
            <LogOut size={18} />
            Sair
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
