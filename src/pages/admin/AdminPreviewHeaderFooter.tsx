import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CmsDisplayModeProvider } from "@/contexts/CmsDisplayModeContext";
import { AdminMirrorEmbedProvider } from "@/contexts/AdminMirrorEmbedContext";

export default function AdminPreviewHeaderFooter() {
  return (
    <CmsDisplayModeProvider value="preview">
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-[100] flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Pré-visualização do rascunho — Header e Footer</p>
          <Link to="/admin/header-footer" className="text-sm font-medium text-primary hover:underline">
            Voltar ao editor
          </Link>
        </div>
        <AdminMirrorEmbedProvider>
          <Header />
          <div className="min-h-[4rem] border-y border-dashed border-border/60 bg-muted/10" aria-hidden />
          <Footer />
        </AdminMirrorEmbedProvider>
      </div>
    </CmsDisplayModeProvider>
  );
}
