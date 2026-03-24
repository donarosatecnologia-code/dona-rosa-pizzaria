import { useState } from "react";
import { Instagram, Facebook, Youtube, Twitter, Linkedin, Globe, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminEditor } from "@/contexts/AdminEditorContext";
import EditableWrapper from "@/components/EditableWrapper";
import { toast } from "sonner";
import logoBranco from "@/assets/logo-branco.png";

const iconMap: Record<string, React.ReactNode> = {
  instagram: <Instagram size={20} />,
  facebook: <Facebook size={20} />,
  youtube: <Youtube size={20} />,
  twitter: <Twitter size={20} />,
  linkedin: <Linkedin size={20} />,
  globe: <Globe size={20} />,
};

const Footer = () => {
  const { isAdmin } = useAdminEditor();
  const queryClient = useQueryClient();

  const { data: socialLinks } = useQuery({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_links").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: navLinks } = useQuery({
    queryKey: ["nav-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nav_links").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["footer-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("name, slug").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const navegacaoLinks = (navLinks ?? []).filter((l) => l.column_key === "navegacao");

  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Col 1 - Logo & Social */}
          <div>
            <EditableWrapper id="footer-logo" type="image" label="Logo Footer">
              <a href="/">
                <img src={logoBranco} alt="Dona Rosa" className="h-16 mb-4" />
              </a>
            </EditableWrapper>
            <p className="text-sm opacity-70 mb-3">Redes Sociais</p>
            <div className="flex gap-3 items-center flex-wrap">
              {(socialLinks ?? []).map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity" aria-label={link.platform}>
                  {iconMap[link.icon_name] || <Globe size={20} />}
                </a>
              ))}
              {isAdmin && <SocialLinkManager />}
            </div>
            <EditableWrapper id="footer-address" type="textarea" label="Endereço Footer">
              <div className="mt-4 text-xs opacity-60 leading-relaxed">
                <p className="font-semibold mb-1">Endereço</p>
                <p>Rua Camilo de Araújo, 347</p>
                <p>Alto de Pinheiros, Vila Jataí</p>
                <p>São Paulo - SP, 05431-020</p>
              </div>
            </EditableWrapper>
          </div>

          {/* Col 2 - Navegação */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Navegação</h4>
            <ul className="space-y-2 text-xs opacity-70">
              {navegacaoLinks.map((link) => (
                <li key={link.id} className="flex items-center gap-1 group">
                  <a href={link.url} className="hover:opacity-100 transition-opacity">{link.label}</a>
                  {isAdmin && <NavLinkActions linkId={link.id} label={link.label} url={link.url} columnKey="navegacao" />}
                </li>
              ))}
            </ul>
            {isAdmin && <AddNavLinkButton columnKey="navegacao" />}
          </div>

          {/* Col 3 - Cardápio */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Cardápio</h4>
            <ul className="space-y-2 text-xs opacity-70">
              {(categories ?? []).map((cat) => (
                <li key={cat.slug}>
                  <a href={`/cardapio#${cat.slug}`} className="hover:opacity-100 transition-opacity">{cat.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 - Horário */}
          <div>
            <EditableWrapper id="footer-horario" type="textarea" label="Horário de Funcionamento">
              <div>
                <h4 className="font-semibold mb-4 text-sm">Horário de Funcionamento</h4>
                <ul className="space-y-2 text-xs opacity-70">
                  <li>Terça – Quinta: 18:30 às 23:00</li>
                  <li>Sexta – Sábado: 18:00 às 00:00</li>
                  <li>Domingo: 18:00 às 23:00</li>
                </ul>
              </div>
            </EditableWrapper>
            <EditableWrapper id="footer-contato" type="textarea" label="Contato Footer">
              <div className="mt-4">
                <p className="font-semibold text-xs mb-1">Contato</p>
                <p className="text-xs opacity-70">(11) 99860-2878</p>
                <p className="text-xs opacity-70">(11) 3031-7876</p>
              </div>
            </EditableWrapper>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-50">
          <p>© 2026 Dona Rosa Pizzaria - Desenvolvido por <a href="https://janaina-guiotti.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity underline">Janaina Guiotti</a></p>
          <div className="flex gap-4">
            <a href="/politica-de-privacidade" className="hover:opacity-100 transition-opacity">Políticas de Privacidade</a>
            <a href="/termos-de-uso" className="hover:opacity-100 transition-opacity">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Social link inline manager for admin
function SocialLinkManager() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: number; platform: string; url: string; icon_name: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: allLinks } = useQuery({
    queryKey: ["social-links"],
  });

  const createMutation = useMutation({
    mutationFn: async (link: { platform: string; url: string; icon_name: string }) => {
      const { error } = await supabase.from("social_links").insert(link);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Rede social adicionada!");
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("social_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Rede social removida!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; platform: string; url: string; icon_name: string }) => {
      const { error } = await supabase.from("social_links").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Rede social atualizada!");
      setEditing(null);
    },
  });

  return (
    <div className="relative">
      <button onClick={() => setShowForm(!showForm)} className="opacity-50 hover:opacity-100 bg-primary-foreground/10 rounded-full p-1" title="Gerenciar redes sociais">
        <Pencil size={14} />
      </button>

      {showForm && (
        <div className="absolute bottom-full left-0 mb-2 bg-background text-foreground rounded-lg shadow-xl border border-border p-4 w-72 z-50">
          <h4 className="text-sm font-semibold mb-3">Redes Sociais</h4>
          <div className="space-y-2 mb-3 max-h-40 overflow-auto">
            {(allLinks as any[] ?? []).map((link: any) => (
              <div key={link.id} className="flex items-center gap-2 text-xs">
                {editing?.id === link.id ? (
                  <>
                    <select value={editing.icon_name} onChange={(e) => setEditing({ ...editing, icon_name: e.target.value })} className="border border-input rounded px-1 py-0.5 text-xs w-20">
                      {["instagram", "facebook", "youtube", "twitter", "linkedin", "globe"].map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} className="flex-1 border border-input rounded px-1 py-0.5 text-xs" />
                    <button onClick={() => updateMutation.mutate(editing)} className="text-primary"><Check size={12} /></button>
                    <button onClick={() => setEditing(null)} className="text-muted-foreground"><X size={12} /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{link.platform}</span>
                    <button onClick={() => setEditing(link)} className="text-primary"><Pencil size={12} /></button>
                    <button onClick={() => deleteMutation.mutate(link.id)} className="text-destructive"><Trash2 size={12} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
          <SocialAddForm onAdd={(data) => createMutation.mutate(data)} />
        </div>
      )}
    </div>
  );
}

function SocialAddForm({ onAdd }: { onAdd: (data: { platform: string; url: string; icon_name: string }) => void }) {
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [iconName, setIconName] = useState("instagram");

  return (
    <div className="border-t border-border pt-2 space-y-1">
      <input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Nome (ex: TikTok)" className="w-full border border-input rounded px-2 py-1 text-xs" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className="w-full border border-input rounded px-2 py-1 text-xs" />
      <div className="flex gap-1">
        <select value={iconName} onChange={(e) => setIconName(e.target.value)} className="border border-input rounded px-1 py-1 text-xs">
          {["instagram", "facebook", "youtube", "twitter", "linkedin", "globe"].map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <button onClick={() => { if (platform && url) { onAdd({ platform, url, icon_name: iconName }); setPlatform(""); setUrl(""); } }} className="btn-primary-dr text-xs px-2 py-1">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// Nav link admin actions
function NavLinkActions({ linkId, label, url, columnKey }: { linkId: number; label: string; url: string; columnKey: string }) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [editUrl, setEditUrl] = useState(url);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nav_links").update({ label: editLabel, url: editUrl }).eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nav-links"] });
      toast.success("Link atualizado!");
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nav_links").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nav-links"] });
      toast.success("Link removido!");
    },
  });

  if (editing) {
    return (
      <span className="flex items-center gap-1 ml-1">
        <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="border border-input rounded px-1 py-0.5 text-xs w-16 bg-background text-foreground" />
        <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="border border-input rounded px-1 py-0.5 text-xs w-20 bg-background text-foreground" />
        <button onClick={() => updateMutation.mutate()} className="text-primary"><Check size={10} /></button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground"><X size={10} /></button>
      </span>
    );
  }

  return (
    <span className="hidden group-hover:flex items-center gap-1 ml-1">
      <button onClick={() => setEditing(true)} className="opacity-60 hover:opacity-100"><Pencil size={10} /></button>
      <button onClick={() => deleteMutation.mutate()} className="opacity-60 hover:opacity-100 text-red-400"><Trash2 size={10} /></button>
    </span>
  );
}

function AddNavLinkButton({ columnKey }: { columnKey: string }) {
  const [show, setShow] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nav_links").insert({ label, url, column_key: columnKey });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nav-links"] });
      toast.success("Link adicionado!");
      setLabel("");
      setUrl("");
      setShow(false);
    },
  });

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="mt-2 text-xs opacity-50 hover:opacity-100 flex items-center gap-1">
        <Plus size={12} /> Adicionar menu
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Texto" className="w-full border border-input/30 bg-primary-foreground/10 rounded px-2 py-1 text-xs" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className="w-full border border-input/30 bg-primary-foreground/10 rounded px-2 py-1 text-xs" />
      <div className="flex gap-1">
        <button onClick={() => mutation.mutate()} className="text-xs bg-primary text-primary-foreground rounded px-2 py-1">Salvar</button>
        <button onClick={() => setShow(false)} className="text-xs opacity-60">Cancelar</button>
      </div>
    </div>
  );
}

export default Footer;
