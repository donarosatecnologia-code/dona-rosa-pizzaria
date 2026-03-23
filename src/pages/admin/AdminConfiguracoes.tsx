import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

const settingsSections = [
  {
    key: "header",
    label: "🔝 Header",
    description: "Logo, menu de navegação, botão de contato",
  },
  {
    key: "footer-contato",
    label: "📍 Footer - Contato",
    description: "Endereço, telefones, redes sociais",
  },
  {
    key: "footer-horario",
    label: "🕐 Footer - Horário",
    description: "Horários de funcionamento",
  },
  {
    key: "footer-redes",
    label: "📱 Footer - Redes Sociais",
    description: "Links do Instagram, Facebook, etc.",
  },
  {
    key: "whatsapp",
    label: "💬 WhatsApp",
    description: "Número e mensagem padrão do WhatsApp",
  },
  {
    key: "seo",
    label: "🔍 SEO",
    description: "Título, descrição e meta tags do site",
  },
];

const AdminConfiguracoes = () => {
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState<string[]>([]);

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
        title: "Chave",
        content: "Valor",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      toast.success("Configuração criada!");
    },
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Configurações Gerais</h1>
      <p className="text-sm text-muted-foreground mb-6">Edite o header, footer, WhatsApp e SEO do site.</p>

      <div className="space-y-3">
        {settingsSections.map((section) => {
          const isOpen = openSections.includes(section.key);
          const sectionContents = contents?.filter((c) => c.section_key === section.key) ?? [];

          return (
            <div key={section.key} className="border border-border rounded-xl overflow-hidden bg-background">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-4 space-y-3 border-t border-border">
                  {isLoading ? (
                    <p className="text-xs text-muted-foreground py-2">Carregando...</p>
                  ) : sectionContents.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground mb-2">Nenhuma configuração encontrada.</p>
                      <button
                        onClick={() => createMutation.mutate(section.key)}
                        className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                      >
                        <Plus size={14} /> Criar configuração
                      </button>
                    </div>
                  ) : (
                    sectionContents.map((item) => (
                      <SettingRow key={item.id} item={item} onSave={(d) => updateMutation.mutate(d)} />
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

function SettingRow({
  item,
  onSave,
}: {
  item: { id: number; title: string | null; content: string | null };
  onSave: (data: { id: number; title?: string; content?: string }) => void;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [content, setContent] = useState(item.content ?? "");

  return (
    <div className="flex flex-col gap-2 pt-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chave / Label" className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Valor / Conteúdo" rows={2} className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm resize-none" />
      <button onClick={() => onSave({ id: item.id, title, content })} className="btn-primary-dr text-xs px-3 py-1.5 self-start">
        Salvar
      </button>
    </div>
  );
}

export default AdminConfiguracoes;
