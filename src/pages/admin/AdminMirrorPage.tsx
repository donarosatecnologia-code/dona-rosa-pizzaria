import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CmsDisplayModeProvider } from "@/contexts/CmsDisplayModeContext";
import { AdminMirrorEmbedProvider } from "@/contexts/AdminMirrorEmbedContext";
import { AdminCmsActionBar } from "@/components/admin/AdminCmsActionBar";
import {
  ADMIN_PAGE_COMPONENTS,
  ADMIN_PAGE_LABELS,
  isAdminPageSlug,
} from "@/pages/admin/adminPageComponents";
import { AppScrollArea } from "@/components/ui/app-scroll-area";

/**
 * Cópia do frontend para edição no admin (rascunho + lápis).
 */
export default function AdminMirrorPage() {
  const { pageSlug } = useParams();

  if (!isAdminPageSlug(pageSlug)) {
    return <Navigate to="/admin/pages" replace />;
  }

  const Page = ADMIN_PAGE_COMPONENTS[pageSlug];
  const pageTitle = ADMIN_PAGE_LABELS[pageSlug];

  return (
    <div className="space-y-4 w-full max-w-6xl mx-auto px-4 lg:px-0">
      <Link
        to="/admin/pages"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Páginas do site
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toque no lápis para editar. Salve antes de colocar no ar.
        </p>
      </div>

      <AdminCmsActionBar />

      <CmsDisplayModeProvider value="preview">
        <AdminMirrorEmbedProvider>
          <div className="admin-mirror-root isolate flex min-h-[min(100%,calc(100dvh-12rem))] lg:min-h-[min(100%,calc(100vh-14rem))] flex-col overflow-hidden rounded-none lg:rounded-lg border-0 lg:border border-border bg-background lg:shadow-inner">
            <AppScrollArea className="min-h-0 flex-1">
              <Page />
            </AppScrollArea>
          </div>
        </AdminMirrorEmbedProvider>
      </CmsDisplayModeProvider>
    </div>
  );
}
