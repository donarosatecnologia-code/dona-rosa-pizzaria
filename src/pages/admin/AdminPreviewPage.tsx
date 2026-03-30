import { Link, Navigate, useParams } from "react-router-dom";
import { CmsDisplayModeProvider } from "@/contexts/CmsDisplayModeContext";
import { ADMIN_PAGE_COMPONENTS, isAdminPageSlug } from "@/pages/admin/adminPageComponents";
import AdminPreviewHeaderFooter from "@/pages/admin/AdminPreviewHeaderFooter";

/**
 * Visualização somente leitura do rascunho (nova aba).
 */
export default function AdminPreviewPage() {
  const { pageSlug } = useParams();

  if (pageSlug === "header-footer") {
    return <AdminPreviewHeaderFooter />;
  }

  if (!isAdminPageSlug(pageSlug)) {
    return <Navigate to="/admin/pages" replace />;
  }

  const Page = ADMIN_PAGE_COMPONENTS[pageSlug];

  return (
    <CmsDisplayModeProvider value="preview">
      <div className="relative min-h-screen bg-background">
        <div className="sticky top-0 z-[100] flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Pré-visualização do rascunho (não publicado)</p>
          <Link to={`/admin/mirror/${pageSlug}`} className="text-sm font-medium text-primary hover:underline">
            Voltar ao editor
          </Link>
        </div>
        <Page />
      </div>
    </CmsDisplayModeProvider>
  );
}
