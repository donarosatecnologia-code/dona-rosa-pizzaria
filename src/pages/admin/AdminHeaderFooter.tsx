import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdminCmsActionBar } from "@/components/admin/AdminCmsActionBar";
import { CmsDisplayModeProvider } from "@/contexts/CmsDisplayModeContext";
import { AdminMirrorEmbedProvider } from "@/contexts/AdminMirrorEmbedContext";
import { cn } from "@/lib/utils";
import { AppScrollArea } from "@/components/ui/app-scroll-area";

export default function AdminHeaderFooter() {
  const [tab, setTab] = useState<"header" | "footer">("header");

  return (
    <CmsDisplayModeProvider value="preview">
      <div className="max-w-6xl space-y-4 w-full px-4 lg:px-0 mx-auto">
        <Link
          to="/admin/pages"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Topo e rodapé</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Toque no lápis em cada parte do site para editar logo, menus e textos.
          </p>
        </div>

        <AdminCmsActionBar />

        <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab("header")}
            className={cn(
              "rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] shrink-0",
              tab === "header" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            Topo
          </button>
          <button
            type="button"
            onClick={() => setTab("footer")}
            className={cn(
              "rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] shrink-0",
              tab === "footer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            Rodapé
          </button>
        </div>

        <AdminMirrorEmbedProvider>
          <div className="max-h-[min(85vh,56rem)] overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <AppScrollArea className="max-h-[min(85vh,56rem)]">
              {tab === "header" ? <Header /> : <Footer />}
            </AppScrollArea>
          </div>
        </AdminMirrorEmbedProvider>
      </div>
    </CmsDisplayModeProvider>
  );
}
