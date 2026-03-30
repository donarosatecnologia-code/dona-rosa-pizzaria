import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { user } = useAuth();
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null);
  const saveDraftHandlerRef = useRef<(() => Promise<void>) | null>(null);

  const registerSaveDraftHandler = useCallback((fn: (() => Promise<void>) | null) => {
    saveDraftHandlerRef.current = fn;
  }, []);

  const requestSaveDraft = useCallback(async () => {
    await saveDraftHandlerRef.current?.();
  }, []);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("is_admin", { _user_id: user.id });
      return !!data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const openEditor = useCallback((target: EditingTarget) => {
    setEditingTarget(target);
  }, []);

  const closeEditor = useCallback(() => {
    setEditingTarget(null);
  }, []);

  return (
    <AdminEditorContext.Provider
      value={{
        isAdmin: !!isAdmin,
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
