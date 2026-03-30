import { useRef, useCallback } from "react";
import { Pencil } from "lucide-react";
import { useAdminEditor, EditingTarget } from "@/contexts/AdminEditorContext";
import { useAdminMirrorSurface } from "@/hooks/useAdminMirrorSurface";

interface EditableWrapperProps {
  id: string;
  type: EditingTarget["elementType"];
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * No site público: apenas children. No admin (espelho): lápis abre o painel lateral.
 */
const EditableWrapper = ({ id, type, label, children, className }: EditableWrapperProps) => {
  const { openEditor } = useAdminEditor();
  const mirrorSurface = useAdminMirrorSurface();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let currentContent = "";
      let currentImageUrl = "";
      let currentLinkUrl = "";

      if (wrapperRef.current) {
        if (type === "image" || type === "carousel" || type === "gallery") {
          const img = wrapperRef.current.querySelector("img");
          if (img) currentImageUrl = img.src;
        } else if (type === "link") {
          const anchor = wrapperRef.current.querySelector("a");
          if (anchor) {
            currentContent = anchor.textContent || "";
            currentLinkUrl = anchor.getAttribute("href") || "";
          }
        } else {
          const el = wrapperRef.current.querySelector("h1, h2, h3, h4, h5, h6, p, span, a");
          if (el) currentContent = el.textContent || "";
        }
      }

      openEditor({
        elementId: id,
        elementType: type,
        label: label || id,
        currentContent,
        currentImageUrl,
        currentLinkUrl,
      });
    },
    [id, type, label, openEditor]
  );

  if (!mirrorSurface) {
    return <>{children}</>;
  }

  return (
    <div ref={wrapperRef} className={`relative group/edit ${className || ""}`}>
      {children}
      <button
        onClick={handleClick}
        className="absolute top-1 right-1 z-30 opacity-0 group-hover/edit:opacity-100 transition-all duration-200 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg hover:scale-110 cursor-pointer"
        title={`Editar: ${label || id}`}
      >
        <Pencil size={14} />
      </button>
      <div
        onClick={handleClick}
        className="absolute inset-0 z-20 opacity-0 group-hover/edit:opacity-100 transition-opacity duration-200 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none"
      />
    </div>
  );
};

export default EditableWrapper;
