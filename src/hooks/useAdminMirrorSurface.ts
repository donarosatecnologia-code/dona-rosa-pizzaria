import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAdminEditor } from "@/contexts/AdminEditorContext";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { canEditCmsRoute } from "@/lib/adminPermissions";

/**
 * Lápis e UI de edição só em rotas de espelho no admin — nunca no site público.
 * Respeita permissão de editar do módulo (Páginas ou Topo e rodapé).
 */
export function useAdminMirrorSurface(): boolean {
  const { pathname } = useLocation();
  const { isAdmin } = useAdminEditor();
  const { data: profile } = useAdminProfile();

  return useMemo(() => {
    if (!isAdmin || !profile) {
      return false;
    }
    if (!pathname.startsWith("/admin/mirror/") && !pathname.startsWith("/admin/header-footer")) {
      return false;
    }
    return canEditCmsRoute(pathname, profile.permissions, profile.is_super_admin);
  }, [isAdmin, pathname, profile]);
}

/** Permissão de editar CMS na rota atual (espelho, header-footer ou preview). */
export function useCanEditCurrentCms(): boolean {
  const { pathname } = useLocation();
  const { data: profile } = useAdminProfile();

  return useMemo(() => {
    if (!profile) {
      return false;
    }
    return canEditCmsRoute(pathname, profile.permissions, profile.is_super_admin);
  }, [pathname, profile]);
}

/** Permissão de ver preview/publicar na rota CMS atual. */
export function useCanViewCurrentCms(): boolean {
  const { pathname } = useLocation();
  const { data: profile } = useAdminProfile();

  return useMemo(() => {
    if (!profile) {
      return false;
    }
    if (profile.is_super_admin) {
      return true;
    }
    const module = pathname.startsWith("/admin/header-footer")
      ? "header_footer"
      : pathname.startsWith("/admin/mirror/") ||
          pathname.startsWith("/admin/pages") ||
          pathname.startsWith("/admin/preview")
        ? "pages"
        : null;
    if (!module) {
      return false;
    }
    return !!profile.permissions[module]?.view;
  }, [pathname, profile]);
}
