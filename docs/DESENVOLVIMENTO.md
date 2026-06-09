# Guia de desenvolvimento — Dona Rosa Pizzaria

Documentação técnica para **rodar, manter e evoluir** o projeto. Sem regras de negócio — apenas stack, comandos, estrutura e fluxos de deploy.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Dados | TanStack Query |
| Rotas | React Router (SPA) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Produção | HostGator (`donarosapizzaria.com.br`) |
| Backup | Vercel (`vercel.json`) |

---

## Setup local

```bash
git clone <url-do-repo>
cd dona-rosa-pizzaria
npm install
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

URL local: **http://localhost:8080**

Sem as variáveis `VITE_SUPABASE_*`, o site não carrega conteúdo do CMS.

---

## Variáveis de ambiente

### Front-end (`.env` — nunca commitar)

| Variável | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave **anon** (pública) |
| `VITE_PUBLIC_SITE_URL` | URL canônica no build (SEO, auth redirects) |

### Edge Functions (Supabase Secrets — nunca no Vite)

```bash
cp supabase/secrets.meta.env.example supabase/secrets.meta.env
# preencher com credenciais Meta
npm run secrets:meta
```

Principais: `META_APP_SECRET`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_VERIFY_TOKEN`, `BROADCAST_DRY_RUN`.

Detalhes: `supabase/secrets.meta.env.example`.

---

## Scripts úteis

```bash
# Desenvolvimento
npm run dev
npm run build
npm run lint
npm run test

# Banco (requer supabase link)
npm run db:status
npm run db:deploy          # push migrations + regen types
npm run db:types

# Edge Functions WhatsApp
npm run functions:deploy:whatsapp
npm run meta:verify

# Testes E2E
npm run test:e2e:smoke
npm run test:regression    # regressão completa (CMS read-only)

# Deploy HostGator
npm run build:hostgator
npm run verify:hostgator
```

---

## Estrutura de pastas

```
src/
├── pages/              # Rotas públicas e /admin/*
├── components/         # UI reutilizável
├── hooks/              # TanStack Query + lógica de dados
├── lib/                # Utilitários (whatsapp, admin, SEO)
└── integrations/supabase/
    ├── client.ts       # Cliente browser (só VITE_*)
    └── types.ts        # Gerado por npm run db:types

supabase/
├── migrations/         # Schema versionado — fonte da verdade
├── functions/          # Edge Functions Deno
│   ├── whatsapp-webhook/
│   ├── broadcast-send/
│   ├── register-site-consent/
│   └── _shared/
└── config.toml         # project_id, auth URLs, verify_jwt por função

scripts/                # Deploy, homologação, Meta
docs/                   # Guias operacionais e QA
e2e/                    # Playwright
```

---

## Supabase CLI (primeira vez)

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref pptgzavxpdltcuqpcovo   # ver config.toml
```

Fluxo ao alterar schema:

1. Criar `supabase/migrations/YYYYMMDDHHmmss_descricao.sql`
2. `npm run db:status`
3. `npm run db:deploy`
4. Commit migration + `types.ts`

**Não** alterar produção pelo Dashboard sem migration correspondente.

---

## Edge Functions

| Função | `verify_jwt` | Responsabilidade |
|---|---|---|
| `whatsapp-webhook` | false | Webhook Meta (HMAC + processamento async) |
| `whatsapp-verify` | false | Health-check Meta |
| `register-site-consent` | false | Opt-in do site (chama RPC `private`) |
| `broadcast-send` | true | Motor de disparo |
| `whatsapp-templates` | true | CRUD/submissão templates |
| `whatsapp-send-message` | true | Envio manual inbox |
| `admin-users` | true | Convite/gestão equipe |
| `keep-alive` | false | Ping diário (plano free) |

Deploy individual ou tudo:

```bash
npm run functions:deploy:site-consent
npm run functions:deploy:whatsapp
```

---

## Área admin — rotas

| Rota | Módulo |
|---|---|
| `/admin/dashboard` | Métricas |
| `/admin/conversas` | Inbox WhatsApp |
| `/admin/contatos` | CRM + importação |
| `/admin/etiquetas` | Tags |
| `/admin/segmentos` | Segmentos |
| `/admin/pesquisas` | Fluxos de pesquisa |
| `/admin/templates` | Modelos Meta |
| `/admin/disparos` | Campanhas |
| `/admin/disparos/:id` | Detalhe/relatório |
| `/admin/pages`, `/admin/mirror/:slug` | CMS páginas |
| `/admin/cardapio` | Cardápio |
| `/admin/header-footer` | Nav/rodapé |
| `/admin/equipe` | Usuários (RBAC) |
| `/admin/configuracoes` | Ajustes WhatsApp |

Auth: Supabase Auth + RLS + `private.is_admin` / RPC `am_i_admin`.

---

## Deploy HostGator

```bash
npm run build:hostgator
# Upload do conteúdo de dist/ para public_html/ (inclui .htaccess)
npm run verify:hostgator
```

O `.htaccess` em `public/` é obrigatório para SPA (rotas diretas sem 404).

Auth do painel **não** roda na HostGator — é Supabase Auth. Ver `docs/SEGURANCA-AUTH.md`.

---

## Testes

| Comando | Escopo |
|---|---|
| `npm run test` | Vitest (unit) |
| `npm run test:e2e:smoke` | Login + rotas admin básicas |
| `npm run test:regression` | Site público read-only + admin read-only |

Credenciais E2E: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` no `.env`.

Homologação manual: `docs/HOMOLOGACAO-T01-T30.md`.

---

## Convenções — não quebrar

- Guards `useHomeBootstrap` / `useSiteShellReady` no site público
- Conteúdo CMS via Supabase (rascunho vs publicado)
- Secrets Meta só no Supabase (nunca `VITE_*`)
- Migrations versionadas para qualquer alteração de schema
- Realtime: canais privados (`private: true`) — ver hooks em `src/hooks/whatsapp/`
- Em QA: evitar **Publicar** no CMS sem autorização

---

## Documentação relacionada

| Arquivo | Público |
|---|---|
| [README.md](../README.md) | Índice geral do repositório |
| [FASES-ENTREGA.md](./FASES-ENTREGA.md) | Status das fases 1–5 |
| [SEGURANCA-AUTH.md](./SEGURANCA-AUTH.md) | Auth, warnings Supabase, HostGator |
| [HOMOLOGACAO-T01-T30.md](./HOMOLOGACAO-T01-T30.md) | Checklist QA |
| [PESQUISAS-WHATSAPP.md](./PESQUISAS-WHATSAPP.md) | Arquitetura técnica pesquisas |
| [GUIA-ROSA-WHATSAPP.md](./GUIA-ROSA-WHATSAPP.md) | Uso do painel (Rosa) |

---

## Credenciais

Solicitar à proprietária: Supabase, HostGator, Meta Business, GitHub Actions secrets.

Dúvidas técnicas: [Janaina Guiotti](https://janaina-guiotti.vercel.app/).
