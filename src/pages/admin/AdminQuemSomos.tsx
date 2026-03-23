import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

const pageSections = [
  { key: "hero", label: "🎯 Hero / Cabeçalho" },
  { key: "tradicao", label: "🏠 Tradição Familiar" },
  { key: "segredos", label: "🍕 Segredos das Pizzas" },
  { key: "criacoes", label: "✨ Criações Exclusivas" },
  { key: "galeria", label: "📸 Galeria de Fotos" },
  { key: "cta", label: "📢 Chamada para Ação" },
];

const AdminQuemSomos = () => {
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const { data: contents, isLoading } = useQuery({
    queryKey: ["admin-page-contents", "quem-somos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page_key", "quem-somos")
        .order("id");
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: { id: number; title?: string; subtitle?: string; content?: string; image_url?: string }) => {
      const { error } = await supabase.from("page_contents").update({
        title: item.title,
        subtitle: item.subtitle,
        content: item.content,
        image_url: item.image_url,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      toast.success("Salvo!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const createMutation = useMutation({
    mutationFn: async (section_key: string) => {
      const { error } = await supabase.from("page_contents").insert({
        page_key: "quem-somos",
        section_key,
        title: "Novo título",
        content: "Conteúdo aqui...",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      toast.success("Seção adicionada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("page_contents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      toast.success("Removido!");
    },
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-1">Quem Somos</h1>
      <p className="text-sm text-muted-foreground mb-4">Clique nos elementos na preview ou edite aqui.</p>

      <div className="space-y-2">
        {pageSections.map((section) => {
          const isOpen = openSections.includes(section.key);
          const sectionContents = contents?.filter((c) => c.section_key.startsWith(`qs-${section.key}`)) ?? [];

          return (
            <div key={section.key} className="border border-border rounded-xl overflow-hidden bg-background">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <span>{section.label}</span>
                <div className="flex items-center gap-2">
                  {sectionContents.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {sectionContents.length}
                    </span>
                  )}
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border">
                  {isLoading ? (
                    <p className="text-xs text-muted-foreground py-2">Carregando...</p>
                  ) : sectionContents.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground mb-2">Nenhum conteúdo.</p>
                      <button
                        onClick={() => createMutation.mutate(`qs-${section.key}`)}
                        className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                      >
                        <Plus size={14} /> Criar conteúdo
                      </button>
                    </div>
                  ) : (
                    sectionContents.map((item) => (
                      <CompactEditor
                        key={item.id}
                        item={item}
                        onSave={(d) => updateMutation.mutate(d)}
                        onDelete={() => deleteMutation.mutate(item.id)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function CompactEditor({
  item,
  onSave,
  onDelete,
}: {
  item: { id: number; section_key: string; title: string | null; subtitle: string | null; content: string | null; image_url: string | null };
  onSave: (data: { id: number; title?: string; subtitle?: string; content?: string; image_url?: string }) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [imageUrl, setImageUrl] = useState(item.image_url ?? "");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, "quem-somos");
    if (url) setImageUrl(url);
    setUploading(false);
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{item.section_key}</span>
        <button onClick={onDelete} className="text-destructive hover:text-destructive/80 p-1">
          <Trash2 size={14} />
        </button>
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Conteúdo" rows={3} className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm resize-none" />
      <div className="flex items-center gap-2">
        {imageUrl && <img src={imageUrl} alt="" className="w-16 h-10 object-cover rounded" />}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs flex-1" />
        {uploading && <span className="text-xs text-muted-foreground">...</span>}
      </div>
      <button onClick={() => onSave({ id: item.id, title, content, image_url: imageUrl })} className="btn-primary-dr text-xs px-3 py-1.5">
        Salvar
      </button>
    </div>
  );
}

export default AdminQuemSomos;
