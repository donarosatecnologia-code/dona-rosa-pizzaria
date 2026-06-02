import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { canAccessAdminRoute } from "@/lib/adminPermissions";

const PUBLIC_ADMIN_PATHS = ["/admin/trocar-senha", "/admin/minha-conta"];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { data: profile, isLoading: profileLoading } = useAdminProfile();
  const { pathname } = useLocation();

  if (authLoading || adminLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-center text-muted-foreground">
          Você não tem permissão para acessar esta área.
        </p>
      </div>
    );
  }

  if (profile?.must_change_password && pathname !== "/admin/trocar-senha") {
    return <Navigate to="/admin/trocar-senha" replace />;
  }

  if (
    profile &&
    !PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) &&
    !canAccessAdminRoute(pathname, profile.permissions, profile.is_super_admin)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-center text-muted-foreground max-w-sm">
          Você não tem acesso a esta parte do painel. Fale com o administrador se precisar.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
