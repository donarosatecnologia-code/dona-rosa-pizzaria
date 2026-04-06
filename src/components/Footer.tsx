import { useState, useEffect } from "react";
import { Instagram, Facebook, Youtube, Twitter, Linkedin, Globe, Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFooterCategories, fetchNavLinks, fetchSocialLinks } from "@/lib/cms-queryFns";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMirrorSurface } from "@/hooks/useAdminMirrorSurface";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandFooterAccent } from "@/components/BrandAccents";
import { toast } from "sonner";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsImage } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";
import { siteContainerClass } from "@/lib/siteLayout";
import { stripHtmlTags } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type NavLinkRow = Database["public"]["Tables"]["nav_links"]["Row"];

const iconMap: Record<string, React.ReactNode> = {
  instagram: <Instagram size={20} />,
  facebook: <Facebook size={20} />,
  youtube: <Youtube size={20} />,
  twitter: <Twitter size={20} />,
  linkedin: <Linkedin size={20} />,
  globe: <Globe size={20} />,
};

const Footer = () => {
  const mirrorSurface = useAdminMirrorSurface();
  const queryClient = useQueryClient();
  const footerLogoImage = useCmsImage("footer-logo");
  const { getText } = useCmsContents(
    [
      "footer-address",
      "footer-horario",
      "footer-contato",
      "footer-title-social",
      "footer-title-nav",
      "footer-title-cardapio",
      "footer-title-col4",
      "footer-col4-extra",
    ],
    "footer",
  );
  const footerAddress = getText("footer-address");
  const footerHorario = getText("footer-horario");
  const footerContato = getText("footer-contato");
  const titleSocial = stripHtmlTags(getText("footer-title-social"));
  const titleNav = stripHtmlTags(getText("footer-title-nav"));
  const titleCardapio = stripHtmlTags(getText("footer-title-cardapio"));
  const titleCol4 = stripHtmlTags(getText("footer-title-col4"));
  const footerCol4Extra = getText("footer-col4-extra");

  const { data: socialLinks } = useQuery({
    queryKey: ["social-links"],
    queryFn: fetchSocialLinks,
  });

  const { data: navLinks } = useQuery({
    queryKey: ["nav-links"],
    queryFn: fetchNavLinks,
  });

  const { data: categories } = useQuery({
    queryKey: ["footer-categories"],
    queryFn: fetchFooterCategories,
  });

  const navegacaoLinks = (navLinks ?? [])
    .filter((l) => l.column_key === "navegacao")
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <footer className="bg-foreground py-12 text-primary-foreground">
      <div className={siteContainerClass}>
        <BrandFooterAccent />
        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 - Logo & Social */}
          <div>
            <EditableWrapper id="footer-logo" type="image" label="Logo Footer">
              <a href="/" className="block mb-4">
                {footerLogoImage ? (
                  <img src={footerLogoImage} alt="Dona Rosa" className="h-16" />
                ) : (
                  <CmsPlaceholder label="Logo do rodapé" className="py-6 text-xs max-w-xs" />
                )}
              </a>
            </EditableWrapper>
            <EditableWrapper id="footer-title-social" type="text" label="Título — Redes sociais">
              <h4 className="mb-4 text-sm font-semibold">
                {titleSocial || (mirrorSurface ? "\u00A0" : "Redes sociais")}
              </h4>
            </EditableWrapper>
            <div className="flex gap-3 items-center flex-wrap">
              {(socialLinks ?? []).map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity" aria-label={link.platform}>
                  {iconMap[link.icon_name] || <Globe size={20} />}
                </a>
              ))}
              {mirrorSurface && <SocialLinkManager />}
            </div>
            <EditableWrapper id="footer-address" type="textarea" label="Endereço Footer">
              <RichText content={footerAddress} className="mt-4 text-xs opacity-60 leading-relaxed space-y-2" />
            </EditableWrapper>
          </div>

          {/* Col 2 - Navegação (100% via nav_links; ordem = sort_order) */}
          <div>
            <EditableWrapper id="footer-title-nav" type="text" label="Título — Navegação">
              <h4 className="mb-4 text-sm font-semibold">{titleNav || (mirrorSurface ? "\u00A0" : "Navegação")}</h4>
            </EditableWrapper>
            <ul className="space-y-2 text-xs opacity-70">
              {navegacaoLinks.map((link, index) => (
                <li key={link.id} className="group flex flex-wrap items-center gap-1">
                  <a href={link.url} className="transition-opacity hover:opacity-100">
                    {link.label}
                  </a>
                  {mirrorSurface && (
                    <NavLinkActions
                      linkId={link.id}
                      label={link.label}
                      url={link.url}
                      canMoveUp={index > 0}
                      canMoveDown={index < navegacaoLinks.length - 1}
                      allLinks={navegacaoLinks}
                    />
                  )}
                </li>
              ))}
            </ul>
            {mirrorSurface && navegacaoLinks.length === 0 && (
              <p className="mb-2 text-xs opacity-50">Nenhum item no menu. Adicione links abaixo.</p>
            )}
            {mirrorSurface && <AddNavLinkButton columnKey="navegacao" existingLinks={navegacaoLinks} />}
          </div>

          {/* Col 3 - Cardápio */}
          <div>
            <EditableWrapper id="footer-title-cardapio" type="text" label="Título — Cardápio">
              <h4 className="mb-4 text-sm font-semibold">{titleCardapio || (mirrorSurface ? "\u00A0" : "Cardápio")}</h4>
            </EditableWrapper>
            <ul className="space-y-2 text-xs opacity-70">
              {(categories ?? []).map((cat) => (
                <li key={cat.slug}>
                  <a href={`/cardapio#${cat.slug}`} className="hover:opacity-100 transition-opacity">{cat.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 - Horário, contato e blocos extras */}
          <div>
            <EditableWrapper id="footer-title-col4" type="text" label="Título — Coluna 4 (horário / info)">
              <h4 className="mb-4 text-sm font-semibold">{titleCol4 || (mirrorSurface ? "\u00A0" : "Horário e contato")}</h4>
            </EditableWrapper>
            <EditableWrapper id="footer-horario" type="textarea" label="Horário de Funcionamento">
              <RichText content={footerHorario} className="space-y-2 text-xs leading-relaxed opacity-70" />
            </EditableWrapper>
            <EditableWrapper id="footer-contato" type="textarea" label="Contato Footer">
              <RichText content={footerContato} className="mt-4 space-y-2 text-xs leading-relaxed opacity-70" />
            </EditableWrapper>
            <EditableWrapper id="footer-col4-extra" type="textarea" label="Textos extras (coluna 4)">
              <RichText content={footerCol4Extra} className="mt-4 space-y-2 text-xs leading-relaxed opacity-70" />
            </EditableWrapper>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-50">
          <p>© 2026 Dona Rosa Pizzaria - Desenvolvido por <a href="https://janaina-guiotti.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity underline">Janaina Guiotti</a></p>
          <div className="flex gap-4">
            <a href="/politica-de-privacidade" className="hover:opacity-100 transition-opacity">Política de Privacidade</a>
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
    queryFn: async () => {
      const { data, error } = await supabase.from("social_links").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
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

async function swapNavLinkSortOrder(a: NavLinkRow, b: NavLinkRow): Promise<void> {
  const ao = a.sort_order;
  const bo = b.sort_order;
  const { error: e1 } = await supabase.from("nav_links").update({ sort_order: bo }).eq("id", a.id);
  if (e1) {
    throw e1;
  }
  const { error: e2 } = await supabase.from("nav_links").update({ sort_order: ao }).eq("id", b.id);
  if (e2) {
    throw e2;
  }
}

// Nav link admin actions: editar, excluir, subir/descer ordem
export function NavLinkActions({
  linkId,
  label,
  url,
  allLinks,
  canMoveUp,
  canMoveDown,
}: {
  linkId: number;
  label: string;
  url: string;
  allLinks: NavLinkRow[];
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [editUrl, setEditUrl] = useState(url);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!editing) {
      setEditLabel(label);
      setEditUrl(url);
    }
  }, [label, url, editing]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nav_links").update({ label: editLabel.trim(), url: editUrl.trim() }).eq("id", linkId);
      if (error) {
        throw error;
      }
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
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nav-links"] });
      toast.success("Link removido!");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (direction: "up" | "down") => {
      const sorted = [...allLinks].sort((x, y) => {
        if (x.sort_order !== y.sort_order) {
          return x.sort_order - y.sort_order;
        }
        return x.id - y.id;
      });
      const idx = sorted.findIndex((l) => l.id === linkId);
      if (idx < 0) {
        return;
      }
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) {
        return;
      }
      await swapNavLinkSortOrder(sorted[idx], sorted[swapIdx]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nav-links"] });
      toast.success("Ordem atualizada!");
    },
  });

  if (editing) {
    return (
      <span className="flex flex-col gap-1 ml-1 mt-1 w-full max-w-[min(100%,18rem)]">
        <input
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          className="border border-input rounded px-2 py-1 text-xs w-full bg-background text-foreground"
          placeholder="Texto do link"
        />
        <input
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          className="border border-input rounded px-2 py-1 text-xs w-full bg-background text-foreground"
          placeholder="/rota ou https://..."
        />
        <span className="flex items-center gap-2">
          <button type="button" onClick={() => updateMutation.mutate()} className="text-primary" title="Salvar">
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setEditLabel(label);
              setEditUrl(url);
            }}
            className="text-muted-foreground"
            title="Cancelar"
          >
            <X size={14} />
          </button>
        </span>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-0.5 ml-1">
      <button
        type="button"
        title="Subir"
        disabled={!canMoveUp || reorderMutation.isPending}
        onClick={() => reorderMutation.mutate("up")}
        className="opacity-70 hover:opacity-100 disabled:opacity-25 p-0.5"
      >
        <ChevronUp size={14} />
      </button>
      <button
        type="button"
        title="Descer"
        disabled={!canMoveDown || reorderMutation.isPending}
        onClick={() => reorderMutation.mutate("down")}
        className="opacity-70 hover:opacity-100 disabled:opacity-25 p-0.5"
      >
        <ChevronDown size={14} />
      </button>
      <button type="button" onClick={() => setEditing(true)} className="opacity-70 hover:opacity-100 p-0.5" title="Editar">
        <Pencil size={12} />
      </button>
      <button type="button" onClick={() => deleteMutation.mutate()} className="opacity-70 hover:opacity-100 text-red-400 p-0.5" title="Excluir">
        <Trash2 size={12} />
      </button>
    </span>
  );
}

export function AddNavLinkButton({ columnKey, existingLinks }: { columnKey: string; existingLinks: NavLinkRow[] }) {
  const [show, setShow] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const maxOrder =
        existingLinks.length === 0 ? -1 : Math.max(...existingLinks.map((l) => l.sort_order));
      const { error } = await supabase
        .from("nav_links")
        .insert({ label: label.trim(), url: url.trim(), column_key: columnKey, sort_order: maxOrder + 1 });
      if (error) {
        throw error;
      }
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
      <button type="button" onClick={() => setShow(true)} className="mt-2 text-xs opacity-50 hover:opacity-100 flex items-center gap-1">
        <Plus size={12} /> Adicionar link
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Texto (ex: Contato)"
        className="w-full border border-input/30 bg-primary-foreground/10 rounded px-2 py-1 text-xs"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (ex: /contato)"
        className="w-full border border-input/30 bg-primary-foreground/10 rounded px-2 py-1 text-xs"
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => {
            if (!label.trim() || !url.trim()) {
              toast.error("Preencha texto e URL.");
              return;
            }
            mutation.mutate();
          }}
          className="text-xs bg-primary text-primary-foreground rounded px-2 py-1"
        >
          Salvar
        </button>
        <button type="button" onClick={() => setShow(false)} className="text-xs opacity-60">
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default Footer;
