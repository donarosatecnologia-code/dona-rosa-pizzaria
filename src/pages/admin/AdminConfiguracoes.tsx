import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const settingsSections = [
  { key: "header", label: "Header" },
  { key: "footer-contato", label: "Footer - Contato" },
  { key: "footer-horario", label: "Footer - Horário" },
  { key: "footer-redes", label: "Footer - Redes Sociais" },
];

const AdminConfiguracoes = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(settingsSections[0].key);

  const { data: contents, isLoading } = useQuery({
    queryKey: ["admin-page-contents", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page_key", "settings")
        .order("id");
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: { id: number; title?: string; content?: string }) => {
      const { error } = await supabase.from("page_contents").update({
        title: item.title,
        content: item.content,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      toast.success("Configuração salva!");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (section_key: string) => {
      const { error } = await supabase.from("page_contents").insert({
        page_key: "settings",
        section_key,
        title: "Título",
        content: "Valor",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      toast.success("Criado!");
    },
  });

  const currentContent = contents?.filter((c) => c.section_key === activeSection) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">Configurações Gerais</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {settingsSections.map((s) => (
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
          <p className="text-muted-foreground mb-4">Nenhuma configuração encontrada.</p>
          <button onClick={() => createMutation.mutate(activeSection)} className="btn-primary-dr">
            Criar configuração
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentContent.map((item) => (
            <SettingEditor key={item.id} item={item} onSave={(data) => updateMutation.mutate(data)} />
          ))}
        </div>
      )}
    </div>
  );
};

function SettingEditor({
  item,
  onSave,
}: {
  item: { id: number; title: string | null; content: string | null };
  onSave: (data: { id: number; title?: string; content?: string }) => void;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [content, setContent] = useState(item.content ?? "");

  return (
    <div className="bg-background rounded-xl p-6 border border-border space-y-3">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Chave / Label</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Valor / Conteúdo</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
      </div>
      <button onClick={() => onSave({ id: item.id, title, content })} className="btn-primary-dr">
        Salvar
      </button>
    </div>
  );
}

export default AdminConfiguracoes;
