import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAdminEditor } from "@/contexts/AdminEditorContext";

/**
 * Lápis e UI de edição só em rotas de espelho no admin — nunca no site público.
 */
export function useAdminMirrorSurface(): boolean {
  const { pathname } = useLocation();
  const { isAdmin } = useAdminEditor();

  return useMemo(() => {
    if (!isAdmin) {
      return false;
    }
    if (pathname.startsWith("/admin/mirror/")) {
      return true;
    }
    if (pathname.startsWith("/admin/header-footer")) {
      return true;
    }
    return false;
  }, [isAdmin, pathname]);
}
