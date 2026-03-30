import { createContext, useContext, type ReactNode } from "react";

export type CmsDisplayMode = "published" | "preview";

const CmsDisplayModeContext = createContext<CmsDisplayMode>("published");

export function CmsDisplayModeProvider({ value, children }: { value: CmsDisplayMode; children: ReactNode }) {
  return <CmsDisplayModeContext.Provider value={value}>{children}</CmsDisplayModeContext.Provider>;
}

export function useCmsDisplayMode(): CmsDisplayMode {
  return useContext(CmsDisplayModeContext);
}
