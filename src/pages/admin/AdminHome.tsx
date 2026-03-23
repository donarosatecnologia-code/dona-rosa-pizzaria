import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";

const sections = [
  { key: "hero", label: "Hero / Banner Principal" },
  { key: "quem-somos-resumo", label: "Quem Somos (Resumo)" },
  { key: "contato", label: "Contato & Reserva" },
  { key: "saude", label: "Saúde e Sustentabilidade" },
];

const AdminHome = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(sections[0].key);

  const { data: contents, isLoading } = useQuery({
    queryKey: ["admin-page-contents", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page_key", "home");
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
      toast.success("Conteúdo salvo!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const createMutation = useMutation({
    mutationFn: async (section_key: string) => {
      const { error } = await supabase.from("page_contents").insert({
        page_key: "home",
        section_key,
        title: "Novo título",
        content: "Conteúdo aqui...",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      toast.success("Seção criada!");
    },
  });

  const currentContent = contents?.filter((c) => c.section_key === activeSection) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">Editar Homepage</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeSection === s.key ? "bg-primary text-primary-foreground" : "bg-background border border-border text-foreground hover:bg-muted"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : currentContent.length === 0 ? (
        <div className="bg-background rounded-xl p-8 border border-border text-center">
          <p className="text-muted-foreground mb-4">Nenhum conteúdo para esta seção.</p>
          <button onClick={() => createMutation.mutate(activeSection)} className="btn-primary-dr">
            Criar conteúdo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentContent.map((item) => (
            <ContentEditor key={item.id} item={item} onSave={(updated) => updateMutation.mutate(updated)} />
          ))}
        </div>
      )}
    </div>
  );
};

function ContentEditor({
  item,
  onSave,
}: {
  item: { id: number; title: string | null; subtitle: string | null; content: string | null; image_url: string | null };
  onSave: (data: { id: number; title?: string; subtitle?: string; content?: string; image_url?: string }) => void;
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
    const url = await uploadImage(file, "home");
    if (url) setImageUrl(url);
    setUploading(false);
  };

  return (
    <div className="bg-background rounded-xl p-6 border border-border space-y-4">
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
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Imagem</label>
        {imageUrl && <img src={imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded mb-2" />}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
        {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
      </div>
      <button
        onClick={() => onSave({ id: item.id, title, subtitle, content, image_url: imageUrl })}
        className="btn-primary-dr"
      >
        Salvar
      </button>
    </div>
  );
}

export default AdminHome;
