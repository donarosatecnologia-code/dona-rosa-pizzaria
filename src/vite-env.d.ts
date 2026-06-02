/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública do site (ex.: https://www.exemplo.com.br) — usada para canônico, JSON-LD e Open Graph */
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** App ID Meta (público) — Embedded Signup */
  readonly VITE_META_APP_ID?: string;
  /** Configuration ID do Facebook Login for Business */
  readonly VITE_META_EMBEDDED_SIGNUP_CONFIG_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
