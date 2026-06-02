import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export interface EditingTarget {
  elementId: string;
  elementType: "text" | "textarea" | "image" | "carousel" | "gallery" | "link";
  label: string;
  currentContent: string;
  currentImageUrl: string;
  currentLinkUrl?: string;
}

interface AdminEditorContextType {
  isAdmin: boolean;
  isEditing: boolean;
  editingTarget: EditingTarget | null;
  openEditor: (target: EditingTarget) => void;
  closeEditor: () => void;
  registerSaveDraftHandler: (fn: (() => Promise<void>) | null) => void;
  requestSaveDraft: () => Promise<void>;
}

const AdminEditorContext = createContext<AdminEditorContextType>({
  isAdmin: false,
  isEditing: false,
  editingTarget: null,
  openEditor: () => {},
  closeEditor: () => {},
  registerSaveDraftHandler: () => {},
  requestSaveDraft: async () => {},
});

export const useAdminEditor = () => useContext(AdminEditorContext);

export function AdminEditorProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useIsAdmin();
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null);
  const saveDraftHandlerRef = useRef<(() => Promise<void>) | null>(null);

  const registerSaveDraftHandler = useCallback((fn: (() => Promise<void>) | null) => {
    saveDraftHandlerRef.current = fn;
  }, []);

  const requestSaveDraft = useCallback(async () => {
    await saveDraftHandlerRef.current?.();
  }, []);

  const openEditor = useCallback((target: EditingTarget) => {
    setEditingTarget(target);
  }, []);

  const closeEditor = useCallback(() => {
    setEditingTarget(null);
  }, []);

  return (
    <AdminEditorContext.Provider
      value={{
        isAdmin,
        isEditing: !!editingTarget,
        editingTarget,
        openEditor,
        closeEditor,
        registerSaveDraftHandler,
        requestSaveDraft,
      }}
    >
      {children}
    </AdminEditorContext.Provider>
  );
}
