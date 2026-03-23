import { useCallback, useRef } from "react";
import { Pencil } from "lucide-react";

interface EditableProps {
  id: string;
  type: "text" | "textarea" | "image" | "carousel" | "gallery";
  label?: string;
  children: React.ReactNode;
}

/**
 * Wraps any page element to make it editable from the admin panel.
 * In admin mode (?admin=true), shows an edit overlay on hover.
 * Clicking sends a postMessage to the parent AdminLayout iframe host,
 * including the current visible content so the editor can pre-fill.
 */
const Editable = ({ id, type, label, children }: EditableProps) => {
  const isAdminMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("admin") === "true";

  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Extract current visible content from the DOM
      let currentContent = "";
      let currentImageUrl = "";

      if (wrapperRef.current) {
        if (type === "image" || type === "carousel" || type === "gallery") {
          const img = wrapperRef.current.querySelector("img");
          if (img) currentImageUrl = img.src;
        } else {
          // Get text content from the first text-bearing element
          const el =
            wrapperRef.current.querySelector("h1, h2, h3, h4, h5, h6, p, span");
          if (el) currentContent = el.textContent || "";
        }
      }

      window.parent.postMessage(
        {
          type: "edit-element",
          elementId: id,
          elementType: type,
          label: label || id,
          currentContent,
          currentImageUrl,
        },
        "*"
      );
    },
    [id, type, label]
  );

  if (!isAdminMode) {
    return <>{children}</>;
  }

  return (
    <div ref={wrapperRef} className="relative group/editable">
      {children}
      <div
        onClick={handleClick}
        className="absolute inset-0 z-20 cursor-pointer opacity-0 group-hover/editable:opacity-100 transition-opacity duration-200"
      >
        <div className="absolute inset-0 border-2 border-dashed border-primary/60 rounded-lg bg-primary/5" />
        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1 shadow-lg">
          <Pencil size={12} />
          {label || "Editar"}
        </div>
      </div>
    </div>
  );
};

export default Editable;
