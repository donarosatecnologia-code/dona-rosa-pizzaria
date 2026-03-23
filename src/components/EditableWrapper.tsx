import { useRef, useCallback } from "react";
import { Pencil } from "lucide-react";
import { useAdminEditor, EditingTarget } from "@/contexts/AdminEditorContext";

interface EditableWrapperProps {
  id: string;
  type: EditingTarget["elementType"];
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps any element on the public site. When admin is logged in,
 * shows a pencil icon on hover. Clicking opens the editor sidebar.
 */
const EditableWrapper = ({ id, type, label, children, className }: EditableWrapperProps) => {
  const { isAdmin, openEditor } = useAdminEditor();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let currentContent = "";
      let currentImageUrl = "";

      if (wrapperRef.current) {
        if (type === "image" || type === "carousel" || type === "gallery") {
          const img = wrapperRef.current.querySelector("img");
          if (img) currentImageUrl = img.src;
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
      });
    },
    [id, type, label, openEditor]
  );

  if (!isAdmin) {
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
