import { Navigate, useParams } from "react-router-dom";
import { CmsDisplayModeProvider } from "@/contexts/CmsDisplayModeContext";
import { AdminMirrorEmbedProvider } from "@/contexts/AdminMirrorEmbedContext";
import { ADMIN_PAGE_COMPONENTS, isAdminPageSlug } from "@/pages/admin/adminPageComponents";

/**
 * Cópia do frontend para edição no admin (rascunho + lápis).
 * Contido no painel para não sobrepor a sidebar; header do site usa sticky dentro desta área.
 */
export default function AdminMirrorPage() {
  const { pageSlug } = useParams();

  if (!isAdminPageSlug(pageSlug)) {
    return <Navigate to="/admin/pages" replace />;
  }

  const Page = ADMIN_PAGE_COMPONENTS[pageSlug];

  return (
    <CmsDisplayModeProvider value="preview">
      <AdminMirrorEmbedProvider>
        <div className="admin-mirror-root isolate flex min-h-[min(100%,calc(100vh-10rem))] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-inner">
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
            <Page />
          </div>
        </div>
      </AdminMirrorEmbedProvider>
    </CmsDisplayModeProvider>
  );
}
