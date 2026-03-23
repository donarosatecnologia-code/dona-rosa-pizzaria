import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const AdminQuemSomos = () => {
  const queryClient = useQueryClient();

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
    mutationFn: async () => {
      const { error } = await supabase.from("page_contents").insert({
        page_key: "quem-somos",
        section_key: `section-${Date.now()}`,
        title: "Nova seção",
        content: "Descrição...",
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Editar Quem Somos</h1>
        <button onClick={() => createMutation.mutate()} className="btn-primary-dr flex items-center gap-2">
          <Plus size={16} /> Nova Seção
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {contents?.map((item) => (
            <SectionEditor
              key={item.id}
              item={item}
              onSave={(data) => updateMutation.mutate(data)}
              onDelete={() => deleteMutation.mutate(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function SectionEditor({
  item,
  onSave,
  onDelete,
}: {
  item: { id: number; section_key: string; title: string | null; subtitle: string | null; content: string | null; image_url: string | null };
  onSave: (data: { id: number; title?: string; subtitle?: string; content?: string; image_url?: string }) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [subtitle, setSubtitle] = useState(item.subtitle ?? "");
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
    <div className="bg-background rounded-xl p-6 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{item.section_key}</span>
        <button onClick={onDelete} className="text-destructive hover:text-destructive/80 p-1">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Subtítulo</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Conteúdo</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Imagem</label>
          {imageUrl && <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-2" />}
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
          {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
        </div>
      </div>
      <button onClick={() => onSave({ id: item.id, title, subtitle, content, image_url: imageUrl })} className="btn-primary-dr">
        Salvar Seção
      </button>
    </div>
  );
}

export default AdminQuemSomos;
