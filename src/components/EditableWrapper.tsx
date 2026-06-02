import { useRef, useCallback } from "react";
import { Pencil } from "lucide-react";
import { useAdminEditor, EditingTarget } from "@/contexts/AdminEditorContext";
import { useAdminMirrorSurface } from "@/hooks/useAdminMirrorSurface";
import { cn } from "@/lib/utils";

interface EditableWrapperProps {
  id: string;
  type: EditingTarget["elementType"];
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * No site público: apenas children. No admin (espelho): lápis abre o painel lateral.
 * No toque (mobile): lápis sempre visível — sem depender de hover.
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
          if (img) {
            currentImageUrl = img.src;
          }
        } else if (type === "link") {
          const anchor = wrapperRef.current.querySelector("a");
          if (anchor) {
            currentContent = anchor.textContent || "";
            currentLinkUrl = anchor.getAttribute("href") || "";
          }
        } else {
          const el = wrapperRef.current.querySelector("h1, h2, h3, h4, h5, h6, p, span, a");
          if (el) {
            currentContent = el.textContent || "";
          }
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
    [id, type, label, openEditor],
  );

  if (!mirrorSurface) {
    return <>{children}</>;
  }

  return (
    <div ref={wrapperRef} className={cn("relative group/edit", className)}>
      {children}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "absolute top-1 right-1 z-30 transition-all duration-200 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer",
          "min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5",
          "opacity-100 lg:opacity-0 lg:group-hover/edit:opacity-100 lg:hover:scale-110",
        )}
        title={`Editar: ${label || id}`}
        aria-label={`Editar: ${label || id}`}
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        onClick={handleClick}
        aria-hidden
        tabIndex={-1}
        className={cn(
          "absolute inset-0 z-20 border-2 border-dashed border-primary/40 rounded-lg lg:pointer-events-none",
          "opacity-100 lg:opacity-0 lg:group-hover/edit:opacity-100",
        )}
      />
    </div>
  );
};

export default EditableWrapper;
