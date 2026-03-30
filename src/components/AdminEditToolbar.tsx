import { useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Rocket, Eye, Loader2 } from "lucide-react";
import { useAdminEditor } from "@/contexts/AdminEditorContext";
import { publishToProduction } from "@/lib/cmsPublish";
import { useCmsUiStore } from "@/stores/cmsUiStore";
import { Button } from "@/components/ui/button";
import { isAdminPageSlug } from "@/pages/admin/adminPageComponents";

export function AdminEditToolbar() {
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const { requestSaveDraft } = useAdminEditor();
  const openConfirmDialog = useCmsUiStore((s) => s.openConfirmDialog);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const visible = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/admin/mirror/")) {
      return true;
    }
    if (p.startsWith("/admin/header-footer")) {
      return true;
    }
    return false;
  }, [location.pathname]);

  const previewSlug = useMemo(() => {
    if (location.pathname.startsWith("/admin/mirror/")) {
      const slug = params.pageSlug;
      return isAdminPageSlug(slug) ? slug : null;
    }
    return null;
  }, [location.pathname, params.pageSlug]);

  if (!visible) {
    return null;
  }

  async function handleSaveDraft(): Promise<void> {
    setSaving(true);
    try {
      await requestSaveDraft();
    } finally {
      setSaving(false);
    }
  }

  function handlePublish(): void {
    openConfirmDialog({
      title: "Publicar alterações",
      message: "Deseja aplicar estas alterações ao site público? Os rascunhos serão copiados para a versão publicada.",
      confirmLabel: "Publicar",
      cancelLabel: "Cancelar",
      variant: "default",
      onConfirm: async () => {
        setPublishing(true);
        try {
          await publishToProduction();
          await queryClient.invalidateQueries();
          toast.success("Site público atualizado.");
        } catch (e) {
          console.error(e);
          toast.error("Não foi possível publicar.");
        } finally {
          setPublishing(false);
        }
      },
    });
  }

  function handlePreview(): void {
    if (previewSlug) {
      window.open(`/admin/preview/${previewSlug}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (location.pathname.startsWith("/admin/header-footer")) {
      window.open("/admin/preview/header-footer", "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-auto text-xs font-medium uppercase tracking-wide text-muted-foreground">Edição</span>
      <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => void handleSaveDraft()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar rascunho
      </Button>
      <Button type="button" size="sm" disabled={publishing} onClick={handlePublish}>
        {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        Publicar
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={handlePreview}>
        <Eye className="h-4 w-4" />
        Visualizar
      </Button>
    </div>
  );
}
