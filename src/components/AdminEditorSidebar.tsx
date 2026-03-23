import { useState, useEffect } from "react";
import { X, Type, AlignLeft, Image, Save, Loader2 } from "lucide-react";
import { useAdminEditor } from "@/contexts/AdminEditorContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/storage";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminEditorSidebar = () => {
  const { isEditing, editingTarget, closeEditor } = useAdminEditor();
  const queryClient = useQueryClient();

  const [textValue, setTextValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);

  // Load existing content when target changes
  useEffect(() => {
    if (!editingTarget) return;
    setImageFile(null);

    const loadContent = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("page_contents")
        .select("*")
        .eq("section_key", editingTarget.elementId)
        .maybeSingle();

      if (data) {
        setRecordId(data.id);
        if (["image", "carousel", "gallery"].includes(editingTarget.elementType)) {
          setImagePreview(data.image_url || editingTarget.currentImageUrl || "");
          setTextValue("");
        } else {
          setTextValue(data.content || data.title || editingTarget.currentContent || "");
          setImagePreview("");
        }
      } else {
        setRecordId(null);
        if (["image", "carousel", "gallery"].includes(editingTarget.elementType)) {
          setImagePreview(editingTarget.currentImageUrl || "");
          setTextValue("");
        } else {
          setTextValue(editingTarget.currentContent || "");
          setImagePreview("");
        }
      }
      setLoading(false);
    };

    loadContent();
  }, [editingTarget]);

  const handleSave = async () => {
    if (!editingTarget) return;
    setSaving(true);

    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        const url = await uploadImage(imageFile, "cms");
        if (url) imageUrl = url;
      }

      const payload: Record<string, string> = {};
      if (["image", "carousel", "gallery"].includes(editingTarget.elementType)) {
        payload.image_url = imageUrl;
      } else {
        payload.content = textValue;
        payload.title = textValue;
      }

      if (recordId) {
        await supabase.from("page_contents").update(payload).eq("id", recordId);
      } else {
        const pageKey = editingTarget.elementId.startsWith("qs-")
          ? "quem-somos"
          : editingTarget.elementId.startsWith("card-")
          ? "cardapio"
          : editingTarget.elementId.startsWith("footer-")
          ? "footer"
          : editingTarget.elementId.startsWith("header-")
          ? "header"
          : "home";

        await supabase.from("page_contents").insert({
          page_key: pageKey,
          section_key: editingTarget.elementId,
          ...payload,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["page-contents"] });
      toast.success("Conteúdo salvo com sucesso!");
      closeEditor();
    } catch {
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const isImageType = editingTarget && ["image", "carousel", "gallery"].includes(editingTarget.elementType);

  const typeIcon = {
    text: <Type size={16} />,
    textarea: <AlignLeft size={16} />,
    image: <Image size={16} />,
    carousel: <Image size={16} />,
    gallery: <Image size={16} />,
  };

  return (
    <>
      {/* Backdrop */}
      {isEditing && (
        <div
          className="fixed inset-0 bg-black/30 z-[60] transition-opacity"
          onClick={closeEditor}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[380px] max-w-[90vw] bg-background border-r border-border shadow-2xl z-[70] transform transition-transform duration-300 ${
          isEditing ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {editingTarget && (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-primary">{typeIcon[editingTarget.elementType]}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{editingTarget.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{editingTarget.elementType}</p>
                </div>
              </div>
              <button onClick={closeEditor} className="text-muted-foreground hover:text-foreground p-1">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
                  <Loader2 size={16} className="animate-spin" />
                  Carregando...
                </div>
              ) : isImageType ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Tipo de mídia
                    </label>
                    <div className="flex gap-2">
                      {["Imagem Única", "Carrossel", "Galeria"].map((t) => (
                        <span
                          key={t}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            (t === "Imagem Única" && editingTarget.elementType === "image") ||
                            (t === "Carrossel" && editingTarget.elementType === "carousel") ||
                            (t === "Galeria" && editingTarget.elementType === "gallery")
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl border border-border"
                    />
                  )}

                  <label className="block">
                    <span className="text-sm font-medium text-foreground mb-1 block">
                      {imageFile ? "Imagem selecionada ✓" : "Escolher nova imagem"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-sm w-full file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </label>
                </div>
              ) : editingTarget.elementType === "textarea" ? (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Conteúdo</label>
                  <textarea
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{textValue.length} caracteres</p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Texto</label>
                  <input
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex gap-2 shrink-0">
              <button
                onClick={closeEditor}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary-dr flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AdminEditorSidebar;
