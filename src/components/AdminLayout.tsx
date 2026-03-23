import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, FileText, UtensilsCrossed, Settings, LogOut, LayoutDashboard, PanelLeftClose, PanelLeftOpen, X, Image, Type, AlignLeft } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import logoSmall from "@/assets/logo-small.png";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/home", label: "Homepage", icon: Home },
  { to: "/admin/quem-somos", label: "Quem Somos", icon: FileText },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

interface EditingElement {
  elementId: string;
  elementType: "text" | "textarea" | "image" | "carousel" | "gallery";
  label: string;
  currentContent: string;
  currentImageUrl: string;
}

const AdminLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingElement, setEditingElement] = useState<EditingElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isEditablePage = ["/admin/home", "/admin/quem-somos"].includes(location.pathname);

  const previewUrlMap: Record<string, string> = {
    "/admin/home": "/?admin=true",
    "/admin/quem-somos": "/quem-somos?admin=true",
  };
  const previewUrl = previewUrlMap[location.pathname];

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "edit-element") {
        setEditingElement({
          elementId: event.data.elementId,
          elementType: event.data.elementType,
          label: event.data.label,
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Clear editing element when changing pages
  useEffect(() => {
    setEditingElement(null);
  }, [location.pathname]);

  const refreshPreview = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar Nav */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-56"} bg-foreground text-primary-foreground flex flex-col shrink-0 transition-all duration-300`}>
        <div className="p-4 border-b border-primary-foreground/20 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <img src={logoSmall} alt="Dona Rosa" className="h-10 brightness-0 invert" />
              <p className="text-xs opacity-60 mt-1">Painel Admin</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-primary-foreground/70 hover:text-primary-foreground p-1">
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-primary-foreground/70 hover:bg-primary-foreground/10"
                } ${sidebarCollapsed ? "justify-center" : ""}`
              }
            >
              <item.icon size={18} />
              {!sidebarCollapsed && item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-primary-foreground/20">
          {!sidebarCollapsed && (
            <a href="/" target="_blank" className="block text-xs text-primary-foreground/50 hover:text-primary-foreground/80 mb-2 px-3">
              ↗ Ver site
            </a>
          )}
          <button
            onClick={signOut}
            title="Sair"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary-foreground/70 hover:bg-primary-foreground/10 w-full ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && "Sair"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      {isEditablePage ? (
        <div className="flex-1 flex">
          {/* Editor sidebar */}
          <div className="w-[380px] shrink-0 bg-background border-r border-border overflow-auto flex flex-col">
            {editingElement ? (
              <InlineEditor
                element={editingElement}
                onClose={() => setEditingElement(null)}
                onSaved={refreshPreview}
              />
            ) : (
              <div className="p-6 flex-1">
                <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground">
                    👆 Clique em qualquer elemento na preview para editá-lo aqui.
                  </p>
                </div>
                <Outlet />
              </div>
            )}
          </div>
          {/* Live Preview */}
          <div className="flex-1 bg-muted overflow-auto relative">
            <div className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">Preview ao vivo</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground ml-auto">Clique nos elementos para editar</span>
            </div>
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-[calc(100vh-41px)] border-none"
              title="Preview"
            />
          </div>
        </div>
      ) : (
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      )}
    </div>
  );
};

/** Inline editor shown when an element is clicked in the preview */
function InlineEditor({
  element,
  onClose,
  onSaved,
}: {
  element: EditingElement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [textValue, setTextValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | null>(null);

  // Load existing content from Supabase
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("page_contents")
        .select("*")
        .eq("section_key", element.elementId)
        .maybeSingle();

      if (data) {
        setRecordId(data.id);
        if (element.elementType === "image") {
          setImagePreview(data.image_url || "");
        } else {
          setTextValue(data.content || data.title || "");
        }
      }
      setLoading(false);
    };
    loadContent();
  }, [element]);

  const handleSave = async () => {
    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        setUploading(true);
        const url = await uploadImage(imageFile, "cms");
        if (url) imageUrl = url;
        setUploading(false);
      }

      const payload: Record<string, string> = {};
      if (element.elementType === "image") {
        payload.image_url = imageUrl;
      } else {
        payload.content = textValue;
        payload.title = textValue;
      }

      if (recordId) {
        await supabase.from("page_contents").update(payload).eq("id", recordId);
      } else {
        // Determine page_key from element ID prefix
        const pageKey = element.elementId.startsWith("qs-") ? "quem-somos" : "home";
        await supabase.from("page_contents").insert({
          page_key: pageKey,
          section_key: element.elementId,
          ...payload,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      toast.success("Conteúdo salvo!");
      onSaved();
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const typeIcon = {
    text: <Type size={16} />,
    textarea: <AlignLeft size={16} />,
    image: <Image size={16} />,
    carousel: <Image size={16} />,
    gallery: <Image size={16} />,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-primary">{typeIcon[element.elementType]}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{element.label}</p>
            <p className="text-xs text-muted-foreground capitalize">{element.elementType}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-auto space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : element.elementType === "image" || element.elementType === "carousel" || element.elementType === "gallery" ? (
          <div className="space-y-3">
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border" />
            )}
            <label className="block">
              <span className="text-sm font-medium text-foreground mb-1 block">Trocar imagem</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm w-full" />
            </label>
            {uploading && <p className="text-xs text-muted-foreground">Enviando...</p>}
          </div>
        ) : element.elementType === "textarea" ? (
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Conteúdo</label>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Texto</label>
            <input
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} className="flex-1 btn-primary-dr" disabled={uploading}>
          {uploading ? "Enviando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

export default AdminLayout;
