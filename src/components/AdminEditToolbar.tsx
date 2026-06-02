import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Rocket, Eye, Loader2 } from "lucide-react";
import { useAdminEditor } from "@/contexts/AdminEditorContext";
import { publishToProduction } from "@/lib/cmsPublish";
import { useCmsUiStore } from "@/stores/cmsUiStore";
import { Button } from "@/components/ui/button";
import { isAdminPageSlug } from "@/pages/admin/adminPageComponents";
import { cn } from "@/lib/utils";

interface AdminEditToolbarProps {
  align?: "start" | "end";
}

export function AdminEditToolbar({ align = "start" }: AdminEditToolbarProps) {
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();
  const { requestSaveDraft } = useAdminEditor();
  const openConfirmDialog = useCmsUiStore((s) => s.openConfirmDialog);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const previewSlug = useMemo(() => {
    const slug = params.pageSlug;
    return isAdminPageSlug(slug) ? slug : null;
  }, [params.pageSlug]);

  async function handleSaveDraft(): Promise<void> {
    setSaving(true);
    try {
      await requestSaveDraft();
      toast.success("Salvo!");
    } catch {
      toast.error("Não deu para salvar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  function handlePublish(): void {
    openConfirmDialog({
      title: "Colocar no ar?",
      message: "As mudanças vão aparecer no site para todo mundo.",
      confirmLabel: "Sim, colocar no ar",
      cancelLabel: "Cancelar",
      variant: "default",
      onConfirm: async () => {
        setPublishing(true);
        try {
          await publishToProduction();
          await queryClient.invalidateQueries();
          toast.success("Site atualizado!");
        } catch {
          toast.error("Não deu para publicar. Tente de novo.");
        } finally {
          setPublishing(false);
        }
      },
    });
  }

  function handlePreview(): void {
    if (previewSlug) {
      navigate(`/admin/preview/${previewSlug}`);
      return;
    }
    navigate("/admin/preview/header-footer");
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        align === "end" ? "justify-end w-full sm:w-auto" : "w-full",
      )}
    >
      <Button
        type="button"
        variant="outline"
        className="min-h-[44px] flex-1 sm:flex-none"
        disabled={saving}
        onClick={() => void handleSaveDraft()}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
        Salvar
      </Button>
      <Button
        type="button"
        className="min-h-[44px] flex-1 sm:flex-none"
        disabled={publishing}
        onClick={handlePublish}
      >
        {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4 mr-1.5" />}
        Colocar no ar
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="min-h-[44px] flex-1 sm:flex-none"
        onClick={handlePreview}
      >
        <Eye className="h-4 w-4 mr-1.5" />
        Ver como fica
      </Button>
    </div>
  );
}
