import { useState, useEffect } from "react";
import { X, Type, AlignLeft, Image, Save, Loader2, Upload, Trash2, Plus } from "lucide-react";
import { useAdminEditor } from "@/contexts/AdminEditorContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage, deleteImage } from "@/lib/storage";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

function getPageKeyFromSectionKey(sectionKey: string) {
  if (sectionKey.startsWith("qs-")) return "quem-somos";
  if (sectionKey.startsWith("card-")) return "cardapio";
  if (sectionKey.startsWith("footer-")) return "footer";
  if (sectionKey.startsWith("header-")) return "header";
  return "home";
}

const AdminEditorSidebar = () => {
  const { isEditing, editingTarget, closeEditor } = useAdminEditor();
  const queryClient = useQueryClient();

  const [textValue, setTextValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [linkUrlValue, setLinkUrlValue] = useState("");

  const isImageType = editingTarget && ["image", "carousel", "gallery"].includes(editingTarget.elementType);
  const isMultiImage = editingTarget && ["carousel", "gallery"].includes(editingTarget.elementType);

  // Load existing content
  useEffect(() => {
    if (!editingTarget) return;
    setImageFile(null);

    const loadContent = async () => {
      setLoading(true);
      const pageKey = getPageKeyFromSectionKey(editingTarget.elementId);
      const { data } = await supabase
        .from("page_contents")
        .select("*")
        .eq("section_key", editingTarget.elementId)
        .eq("page_key", pageKey)
        .maybeSingle();

      if (data) {
        setRecordId(data.id);
        if (isImageType && !isMultiImage) {
          setImagePreview(data.image_url || editingTarget.currentImageUrl || "");
          setTextValue("");
          setLinkUrlValue("");
        } else if (editingTarget.elementType === "link") {
          setTextValue(data.title || editingTarget.currentContent || "");
          setLinkUrlValue(data.content || editingTarget.currentLinkUrl || "");
          setImagePreview("");
        } else if (!isImageType) {
          setTextValue(data.content || data.title || editingTarget.currentContent || "");
          setImagePreview("");
          setLinkUrlValue("");
        }
      } else {
        setRecordId(null);
        if (isImageType && !isMultiImage) {
          setImagePreview(editingTarget.currentImageUrl || "");
          setTextValue("");
          setLinkUrlValue("");
        } else if (editingTarget.elementType === "link") {
          setTextValue(editingTarget.currentContent || "");
          setLinkUrlValue(editingTarget.currentLinkUrl || "");
          setImagePreview("");
        } else if (!isImageType) {
          setTextValue(editingTarget.currentContent || "");
          setImagePreview("");
          setLinkUrlValue("");
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
      if (isImageType && !isMultiImage) {
        payload.image_url = imageUrl;
      } else if (editingTarget.elementType === "link") {
        payload.title = textValue;
        payload.content = linkUrlValue;
      } else if (!isImageType) {
        payload.content = textValue;
        payload.title = textValue;
      }

      if (recordId) {
        const { error } = await supabase.from("page_contents").update(payload).eq("id", recordId);
        if (error) throw error;
      } else {
        const pageKey = getPageKeyFromSectionKey(editingTarget.elementId);

        const { error } = await supabase.from("page_contents").insert({ page_key: pageKey, section_key: editingTarget.elementId, ...payload });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["page-contents"] });
      queryClient.invalidateQueries({ queryKey: ["page-contents-batch"] });
      queryClient.invalidateQueries({ queryKey: ["page-contents", editingTarget.elementId] });
      queryClient.invalidateQueries({ queryKey: ["page-contents", editingTarget.elementId, "carousel-columns"] });
      toast.success("Conteúdo salvo com sucesso!");
      closeEditor();
    } catch (error) {
      console.error("Erro ao salvar conteúdo:", error);
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

  const typeIcon: Record<string, React.ReactNode> = {
    text: <Type size={16} />,
    textarea: <AlignLeft size={16} />,
    image: <Image size={16} />,
    carousel: <Image size={16} />,
    gallery: <Image size={16} />,
    link: <Type size={16} />,
  };

  return (
    <>
      {isEditing && <div className="fixed inset-0 bg-black/30 z-[60] transition-opacity" onClick={closeEditor} />}

      <div className={`fixed top-0 left-0 h-full w-[380px] max-w-[90vw] bg-background border-r border-border shadow-2xl z-[70] transform transition-transform duration-300 ${isEditing ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
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
              <button onClick={closeEditor} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
                  <Loader2 size={16} className="animate-spin" /> Carregando...
                </div>
              ) : isMultiImage ? (
                <GalleryManager
                  sectionKey={editingTarget.elementId}
                  pageKey={getPageKeyFromSectionKey(editingTarget.elementId)}
                  mediaType={editingTarget.elementType as "carousel" | "gallery"}
                />
              ) : isImageType ? (
                <div className="space-y-4">
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border" />}
                  <label className="block">
                    <span className="text-sm font-medium text-foreground mb-1 block">{imageFile ? "Imagem selecionada ✓" : "Escolher nova imagem"}</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm w-full file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  </label>
                </div>
              ) : editingTarget.elementType === "link" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Texto do botão</label>
                    <RichTextEditor value={textValue} onChange={setTextValue} minHeightClassName="min-h-[100px]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Link do botão</label>
                    <input value={linkUrlValue} onChange={(e) => setLinkUrlValue(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" placeholder="/contato ou https://..." />
                  </div>
                </div>
              ) : editingTarget.elementType === "textarea" ? (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Conteúdo</label>
                  <RichTextEditor value={textValue} onChange={setTextValue} />
                  <p className="text-xs text-muted-foreground mt-1">{textValue.length} caracteres</p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Texto</label>
                  <RichTextEditor value={textValue} onChange={setTextValue} minHeightClassName="min-h-[100px]" />
                </div>
              )}
            </div>

            {/* Footer - hide save for multi-image (they save inline) */}
            {!isMultiImage && (
              <div className="p-4 border-t border-border flex gap-2 shrink-0">
                <button onClick={closeEditor} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary-dr flex items-center justify-center gap-2">
                  {saving ? (<><Loader2 size={14} className="animate-spin" /> Salvando...</>) : (<><Save size={14} /> Salvar</>)}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

// Multi-image gallery/carousel manager
function GalleryManager({
  sectionKey,
  pageKey,
  mediaType,
}: {
  sectionKey: string;
  pageKey: string;
  mediaType: "carousel" | "gallery";
}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [columns, setColumns] = useState("1");
  const isCarousel = mediaType === "carousel";

  const { data: images, isLoading } = useQuery({
    queryKey: ["gallery-images", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_images").select("*").eq("section_key", sectionKey).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: carouselConfig } = useQuery({
    queryKey: ["page-contents", sectionKey, "carousel-columns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("id, content")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isCarousel,
  });

  useEffect(() => {
    if (!isCarousel) return;
    const parsed = Number.parseInt(carouselConfig?.content || "1", 10);
    const normalized = Number.isNaN(parsed) ? 1 : Math.min(4, Math.max(1, parsed));
    setColumns(normalized.toString());
  }, [carouselConfig, isCarousel]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const { error } = await supabase.from("gallery_images").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images", sectionKey] });
      setSelectedIds(new Set());
      toast.success("Imagens removidas!");
    },
  });

  const saveColumnsMutation = useMutation({
    mutationFn: async (nextColumns: number) => {
      if (carouselConfig?.id) {
        const { error } = await supabase
          .from("page_contents")
          .update({ content: nextColumns.toString() })
          .eq("id", carouselConfig.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("page_contents").insert({
        page_key: pageKey,
        section_key: sectionKey,
        content: nextColumns.toString(),
        title: "carousel_columns",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-contents", sectionKey, "carousel-columns"] });
      toast.success("Quantidade de colunas do carrossel salva!");
    },
    onError: () => {
      toast.error("Erro ao salvar colunas do carrossel.");
    },
  });

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);

    try {
      const maxOrder = (images ?? []).reduce((max, img) => Math.max(max, img.sort_order), 0);
      const uploads = await Promise.all(
        files.map(async (file, i) => {
          const url = await uploadImage(file, "gallery");
          return url ? { section_key: sectionKey, image_url: url, alt_text: file.name, sort_order: maxOrder + i + 1 } : null;
        })
      );

      const validUploads = uploads.filter(Boolean);
      if (validUploads.length > 0) {
        const { error } = await supabase.from("gallery_images").insert(validUploads);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["gallery-images", sectionKey] });
        toast.success(`${validUploads.length} imagem(ns) adicionada(s)!`);
      }
    } catch {
      toast.error("Erro ao enviar imagens");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === (images ?? []).length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set((images ?? []).map((img) => img.id)));
    }
  };

  return (
    <div className="space-y-4">
      {isCarousel && (
        <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
          <label className="text-xs font-medium text-foreground block">
            Colunas visíveis no carrossel
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={4}
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              className="w-20 px-2 py-1.5 border border-input rounded text-sm bg-background"
            />
            <button
              onClick={() => {
                const parsed = Number.parseInt(columns, 10);
                if (Number.isNaN(parsed) || parsed < 1 || parsed > 4) {
                  toast.error("Informe um valor entre 1 e 4 colunas.");
                  return;
                }
                saveColumnsMutation.mutate(parsed);
              }}
              className="btn-primary-dr text-xs px-3 py-1.5"
            >
              Salvar colunas
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Exemplo: Cardápio = 3 colunas, Cursos/Eventos = 2 colunas.
          </p>
        </div>
      )}

      {/* Upload */}
      <div>
        <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} className="text-primary" />}
          <span className="text-sm text-primary font-medium">{uploading ? "Enviando..." : "Adicionar imagens"}</span>
          <input type="file" accept="image/*" multiple onChange={handleMultiUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
          <span className="text-xs text-destructive font-medium flex-1">{selectedIds.size} selecionada(s)</span>
          <button onClick={() => deleteMutation.mutate(Array.from(selectedIds))} className="text-xs bg-destructive text-destructive-foreground rounded px-3 py-1 flex items-center gap-1">
            <Trash2 size={12} /> Excluir
          </button>
        </div>
      )}

      {/* Images grid */}
      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground text-sm">Carregando...</div>
      ) : (
        <>
          {(images ?? []).length > 0 && (
            <button onClick={toggleAll} className="text-xs text-primary hover:underline">
              {selectedIds.size === (images ?? []).length ? "Desmarcar todas" : "Selecionar todas"}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            {(images ?? []).map((img) => (
              <div key={img.id} className={`relative rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${selectedIds.has(img.id) ? "border-primary" : "border-border"}`} onClick={() => toggleSelect(img.id)}>
                <img src={img.image_url} alt={img.alt_text || ""} className="w-full h-24 object-cover" />
                <div className={`absolute top-1 left-1 w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${selectedIds.has(img.id) ? "bg-primary border-primary text-primary-foreground" : "bg-background/80 border-border"}`}>
                  {selectedIds.has(img.id) && "✓"}
                </div>
              </div>
            ))}
          </div>
          {(images ?? []).length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Nenhuma imagem adicionada ainda.</p>}
        </>
      )}
    </div>
  );
}

export default AdminEditorSidebar;
