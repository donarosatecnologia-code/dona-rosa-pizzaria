import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CmsDisplayModeProvider } from "@/contexts/CmsDisplayModeContext";
import { AdminMirrorEmbedProvider } from "@/contexts/AdminMirrorEmbedContext";
import { cn } from "@/lib/utils";

export default function AdminHeaderFooter() {
  const [tab, setTab] = useState<"header" | "footer">("header");

  return (
    <CmsDisplayModeProvider value="preview">
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Header &amp; Footer</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Edite logo, textos e menus no tamanho real. Use o lápis em cada bloco e salve o rascunho na barra superior.
          </p>
        </div>

        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setTab("header")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === "header" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            Header
          </button>
          <button
            type="button"
            onClick={() => setTab("footer")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === "footer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            Footer
          </button>
        </div>

        <AdminMirrorEmbedProvider>
          <div className="max-h-[min(85vh,56rem)] overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <div className="max-h-[min(85vh,56rem)] overflow-x-hidden overflow-y-auto overscroll-contain">
              {tab === "header" ? <Header /> : <Footer />}
            </div>
          </div>
        </AdminMirrorEmbedProvider>
      </div>
    </CmsDisplayModeProvider>
  );
}
