/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública do site (ex.: https://www.exemplo.com.br) — usada para canônico, JSON-LD e Open Graph */
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
