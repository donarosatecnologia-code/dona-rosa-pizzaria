import { createContext, useContext, type ReactNode } from "react";

const AdminMirrorEmbedContext = createContext(false);

export function AdminMirrorEmbedProvider({ children }: { children: ReactNode }) {
  return <AdminMirrorEmbedContext.Provider value={true}>{children}</AdminMirrorEmbedContext.Provider>;
}

export function useAdminMirrorEmbed(): boolean {
  return useContext(AdminMirrorEmbedContext);
}
