import { useCallback } from "react";
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
 * Clicking sends a postMessage to the parent AdminLayout iframe host.
 */
const Editable = ({ id, type, label, children }: EditableProps) => {
  const isAdminMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("admin") === "true";

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Send message to parent (AdminLayout)
      window.parent.postMessage(
        {
          type: "edit-element",
          elementId: id,
          elementType: type,
          label: label || id,
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
    <div className="relative group/editable">
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
