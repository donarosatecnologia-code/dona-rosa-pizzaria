# 🍕 Dona Rosa Pizzaria — Guia do Desenvolvedor
 
> Referência rápida e prática para quem vai **manter, atualizar ou evoluir** este projeto.
 
---
 
## Índice
 
1. [Visão geral da stack](#1-visão-geral-da-stack)
2. [Rodando localmente em 5 minutos](#2-rodando-localmente-em-5-minutos)
3. [Variáveis de ambiente](#3-variáveis-de-ambiente)
4. [Scripts disponíveis](#4-scripts-disponíveis)
5. [Estrutura do projeto](#5-estrutura-do-projeto)
6. [Arquitetura e decisões importantes](#6-arquitetura-e-decisões-importantes)
7. [Fluxo de conteúdo (CMS via Supabase)](#7-fluxo-de-conteúdo-cms-via-supabase)
8. [Área administrativa](#8-área-administrativa)
9. [SEO e metadados](#9-seo-e-metadados)
10. [Deploy — HostGator (produção) e Vercel (backup)](#10-deploy--hostgator-produção-e-vercel-backup)
11. [Keep-alive do Supabase (plano gratuito)](#11-keep-alive-do-supabase-plano-gratuito)
12. [Supabase CLI — linkar projeto e migrations](#12-supabase-cli--linkar-projeto-e-migrations)
13. [WhatsApp — integração (infra Supabase)](#13-whatsapp--integração-infra-supabase)
14. [Convenções técnicas — não quebre isso](#14-convenções-técnicas--não-quebre-isso)
15. [Checklist de QA — painel administrativo](#15-checklist-de-qa--painel-administrativo)
16. [Segurança e autenticação](#16-segurança-e-autenticação)
17. [Onde pedir ajuda / credenciais](#17-onde-pedir-ajuda--credenciais)
 
---
 
## 1. Visão geral da stack
 
| Camada | Tecnologia |
|---|---|
| Front-end | React + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Dados assíncronos | TanStack Query |
| Roteamento | React Router (SPA) |
| Backend / CMS / Auth | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Hospedagem produção | **HostGator** — `https://donarosapizzaria.com.br` |
| Hospedagem backup | **Vercel** — deploy alternativo com `vercel.json` |
 
---
 
## 2. Rodando localmente em 5 minutos
 
```bash
# 1. Clone e entre na pasta
git clone <url-do-repo>
cd dona-rosa-pizzaria
 
# 2. Instale dependências
npm install
 
# 3. Configure o ambiente
cp .env.example .env
# Abra o .env e preencha as 3 variáveis (veja seção 3)
 
# 4. Suba o servidor de desenvolvimento
npm run dev
```
 
Acesse: **http://localhost:8080**
 
> ⚠️ Sem as variáveis do Supabase preenchidas, a aplicação não carregará o conteúdo.
 
---
 
## 3. Variáveis de ambiente
 
| Variável | O que é | Onde achar |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave **anon** (pública) do Supabase | Mesmo lugar acima |
| `VITE_PUBLIC_SITE_URL` | URL canônica do site no ambiente de build | HostGator: `https://donarosapizzaria.com.br` · Vercel: URL do projeto |
 
**Regras importantes:**
- Nunca commite o arquivo `.env` (já está no `.gitignore`).
- Nunca use a *service role key* no front-end — apenas a chave **anon**.
- Em desenvolvimento, `VITE_PUBLIC_SITE_URL` pode ficar vazio (usa `window.location.origin`).
- As credenciais reais devem ser solicitadas **diretamente à proprietária da pizzaria**.
 
---
 
## 4. Scripts disponíveis
 
```bash
npm run dev              # Servidor local com hot-reload (porta 8080)
npm run build            # Build de produção genérico (usa .env local)
npm run build:hostgator  # Build para upload na HostGator (fixa URL canônica)
npm run preview          # Serve o build localmente para teste
npm run lint             # Verifica qualidade do código com ESLint
npm run test             # Roda os testes com Vitest
npm run test:regression  # Regressão E2E (site + admin read-only)
npm run db:deploy        # Aplica migrations pendentes + regen types
npm run functions:deploy:whatsapp  # Todas as Edge Functions WhatsApp + site-consent
```
 
---
 
## 5. Estrutura do projeto
 
```
dona-rosa-pizzaria/
├── src/
│   ├── pages/          # Páginas da aplicação (rotas públicas e admin)
│   ├── components/     # Componentes reutilizáveis
│   ├── hooks/          # Hooks customizados (ex: useHomeBootstrap, useSiteShellReady)
│   └── integrations/
│       └── supabase/
│           └── client.ts  # Cliente Supabase (lê apenas as variáveis VITE_*)
├── supabase/
│   ├── migrations/     # Esquema e seeds do banco — versionar sempre!
│   ├── schema-baseline.reference.sql  # Referência do schema base (não aplicar em prod)
│   └── config.toml     # project_id do Supabase linkado
├── public/
│   ├── .htaccess       # Fallback SPA para Apache (HostGator) — copiado para dist/
│   ├── robots.txt
│   ├── sitemap.xml     # Atualizar URL base antes do go-live
│   └── llms.txt        # Resumo do site para agentes de IA
├── scripts/
│   └── build-hostgator.sh  # Build + checklist de upload FTP
├── .github/
│   └── workflows/
│       └── supabase-keep-alive.yml  # Ping diário para evitar pausa no Supabase
├── vercel.json         # Rewrite de rotas SPA para index.html
└── .env.example        # Template das variáveis de ambiente
```
 
---
 
## 6. Arquitetura e decisões importantes
 
### Carregamento bloqueante (sem flash de placeholder)
 
O site usa uma estratégia de carregamento que **bloqueia o render** até os dados essenciais chegarem:
 
- **Home** → usa o hook `useHomeBootstrap`, que aguarda shell (nav, redes sociais, rodapé), textos, imagens CMS, galeria e carrosséis.
- **Demais páginas** → usam `useSiteShellReady` combinado com as queries específicas de cada página.
- Enquanto carrega, exibe o componente `<LoadingScreen />`.
 
> ✅ Isso garante que **nenhum placeholder vazio** apareça no primeiro paint.  
> ❌ Não remova essas guards de carregamento sem revisar todas as páginas.
 
### Roteamento SPA

O projeto usa `react-router-dom`. Rotas como `/admin`, `/login`, `/politica-de-privacidade` e `/termos-de-uso` existem só no client-side — o servidor precisa devolver `index.html` para qualquer path que não seja arquivo estático.

| Ambiente | Mecanismo |
|---|---|
| Vercel | `vercel.json` — rewrite `/(.*)` → `/index.html` |
| HostGator (Apache) | `public/.htaccess` — `mod_rewrite` para `index.html` |

Sem esse fallback, acessar a URL diretamente (ou dar F5) retorna **404**, embora a home (`/`) funcione.
 
---
 
## 7. Fluxo de conteúdo (CMS via Supabase)
 
Todo o conteúdo público (textos, imagens, cardápio, etc.) vem do **Supabase**, não está hardcoded no código.
 
**Fluxo:**
1. Proprietária edita conteúdo na **área `/admin`**
2. Conteúdo fica salvo no Supabase (com suporte a rascunhos e publicação)
3. O front-end busca e exibe apenas o conteúdo **publicado**
 
> ⚠️ Em produção, nunca deve aparecer placeholder. Se aparecer, verificar se o conteúdo está publicado no Supabase.
 
**Ao adicionar novas tabelas ou colunas:** crie uma migration em `supabase/migrations/` e versione no Git. Nunca altere o banco manualmente em produção sem migration correspondente.
 
---
 
## 8. Área administrativa

- Rota base: `/admin` (redireciona para `/admin/dashboard`) e `/login`
- **Autenticação via Supabase Auth** — não há usuário hardcoded.
- Rotas privadas usam `noindex` via `SeoShell` (`/admin`, `/login`, recuperar/redefinir senha).
- Permissões por módulo em `src/lib/adminPermissions.ts` (super admin tem acesso total).
- Autorização interna: funções `private.is_admin` / `private.admin_can_manage_users` (RLS); RPC exposta ao front: `am_i_admin` e `can_i_manage_users`.

### Rotas do painel

| Rota | Módulo | Observação |
|---|---|---|
| `/admin/dashboard` | Início | Métricas e gráficos |
| `/admin/conversas` | Mensagens | Inbox WhatsApp |
| `/admin/conversas/:id` | Mensagens | Thread |
| `/admin/contatos` | Clientes | CRM + importação |
| `/admin/etiquetas` | Etiquetas | Tags de contatos |
| `/admin/segmentos` | Segmentos | Filtros para campanhas |
| `/admin/pesquisas` | Pesquisas | Fluxos multi-pergunta WhatsApp |
| `/admin/templates` | Mensagens prontas | Modelos Meta |
| `/admin/disparos` | Promoções | Campanhas |
| `/admin/disparos/:id` | Promoções | Detalhe/relatório da campanha |
| `/admin/pages` | Páginas do site | Links para espelho/preview |
| `/admin/mirror/:slug` | Páginas do site | Edição visual (rascunho) |
| `/admin/cardapio` | Cardápio | Produtos e categorias |
| `/admin/header-footer` | Topo e rodapé | Nav, redes, rodapé |
| `/admin/equipe` | Equipe | Só super admin / gestor |
| `/admin/equipe/convidar` | Equipe | Convite |
| `/admin/equipe/editar/:id` | Equipe | Permissões |
| `/admin/minha-conta` | — | Nome do usuário |
| `/admin/trocar-senha` | — | Obrigatório após convite |
| `/admin/configuracoes` | Ajustes | Horário WhatsApp, links |

> ⚠️ **Publicar conteúdo** (`publish_page_contents_drafts`, botão Publicar no CMS) consolida rascunhos para o site público. Em QA ou homologação, prefira **Salvar rascunho** e **Preview** — nunca publicar cardápio/páginas/topo e rodapé sem autorização explícita da Rosa.

Para criar ou resetar acesso admin, use o painel do Supabase (Authentication → Users) ou `/admin/equipe/convidar`.

---
 
## 9. SEO e metadados
 
| Onde | O que faz |
|---|---|
| `index.html` | Metadados base: idioma `pt-BR`, descrição, Open Graph, Twitter |
| Componente `SeoShell` | Ajusta `<title>`, canonical, robots, JSON-LD (`Restaurant`) e OG por rota |
| `public/robots.txt` | Controla indexação; bloqueia `/admin` e `/login` |
| `public/sitemap.xml` | **Atualizar a URL base antes do go-live** (trocar `https://www.example.com`) |
| `public/llms.txt` | Resumo do site para ferramentas de IA |
 
> ⚠️ Mantenha `VITE_PUBLIC_SITE_URL` corretamente configurado em cada ambiente. Ele alimenta o link canonical, JSON-LD e Open Graph.
 
---
 
## 10. Deploy — HostGator (produção) e Vercel (backup)

### Domínios e URLs úteis

| Uso | URL |
|---|---|
| Site público (HostGator) | `https://donarosapizzaria.com.br` |
| Política de privacidade (Meta) | `https://donarosapizzaria.com.br/politica-de-privacidade` |
| Termos de uso (Meta) | `https://donarosapizzaria.com.br/termos-de-uso` |
| Painel admin | `https://donarosapizzaria.com.br/admin` |
| Login | `https://donarosapizzaria.com.br/login` |

O conteúdo legal vem do CMS (Supabase). Se a página abrir em branco ou com placeholder, publique o conteúdo correspondente no admin antes de enviar à Meta.

### Auth Supabase (redirects)

O `supabase/config.toml` define `site_url` e `additional_redirect_urls` para o domínio de produção. Após alterar, sincronize:

```bash
supabase config push --yes
```

Confirme também no Dashboard: **Authentication → URL Configuration**.

Para links de convite da equipe (Edge Function `admin-users`), configure no Supabase:

```bash
supabase secrets set PUBLIC_SITE_URL=https://donarosapizzaria.com.br
```

---

### 10.A — Deploy na HostGator (produção atual)

**Causa comum de 404:** Apache servindo só arquivos físicos, sem fallback SPA. O arquivo `public/.htaccess` corrige isso — ele **deve** estar na raiz de `public_html/` após o upload.

#### Build

```bash
cp .env.example .env   # preencha VITE_SUPABASE_* 
npm run build:hostgator
```

O script define `VITE_PUBLIC_SITE_URL=https://donarosapizzaria.com.br`, roda `npm run build` e valida que `dist/.htaccess` existe.

#### Upload (FTP / Gerenciador de arquivos)

1. Faça backup do `public_html/` atual (opcional, recomendado).
2. Envie **todo** o conteúdo de `dist/` para `public_html/`.
3. **Importante:** habilite “mostrar arquivos ocultos” no cliente FTP — o `.htaccess` começa com ponto.
4. Não envie a pasta `dist` em si; envie o **conteúdo** (incluindo `index.html`, `assets/`, `.htaccess`).

#### Se a home abre mas rotas dão 404 da HostGator

Sintoma: `/` funciona, mas `/login` ou `/politica-de-privacidade` mostram a página **“Ops, Não encontramos essa página!”** da HostGator.

Isso significa que o **`index.html` foi enviado, mas o `.htaccess` não está ativo** na raiz de `public_html/`.

**Solução (cPanel — mais confiável que FTP):**

1. Abra **Gerenciador de arquivos** → `public_html/`
2. Confirme se existe `.htaccess` ao lado de `index.html`
3. Se **não existir**: o build gera `dist/hostgator-htaccess.txt` — faça upload e **renomeie** para `.htaccess`
4. Se existir um `.htaccess` antigo (WordPress, etc.), substitua pelo do projeto
5. Teste: `https://donarosapizzaria.com.br/spa-deploy-marker.txt` deve abrir (confirma upload recente)

Validação automatizada (após upload):

```bash
npm run verify:hostgator
```

#### Checklist pós-upload HostGator

- [ ] `https://donarosapizzaria.com.br/` carrega a home
- [ ] `https://donarosapizzaria.com.br/politica-de-privacidade` abre (não 404)
- [ ] `https://donarosapizzaria.com.br/termos-de-uso` abre (não 404)
- [ ] `https://donarosapizzaria.com.br/admin` abre tela de login (não 404)
- [ ] F5 em rotas internas continua funcionando
- [ ] Login e recuperação de senha redirecionam corretamente

> **Nota:** mensagens no console como `multi-tabs.js` / i18next vêm de **extensões do navegador**, não do projeto.

---

### 10.B — Deploy na Vercel (backup)

Use quando precisar de preview rápido, rollback ou alternativa enquanto o HostGator não estiver acessível.

#### Configuração inicial (primeira vez)

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório.
2. Framework detectado: **Vite** (ou confirme manualmente).
3. **Build command:** `npm run build`
4. **Output directory:** `dist`
5. Em **Settings → Environment Variables**, para Production (e Preview se quiser):

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon pública |
| `VITE_PUBLIC_SITE_URL` | URL do deploy Vercel (ex.: `https://dona-rosa-pizzaria.vercel.app`) |

O `vercel.json` na raiz já configura rewrite SPA — não é necessário `.htaccess` na Vercel.

#### Deploy contínuo

Merge na branch principal → deploy automático (se o projeto estiver conectado ao Git).

#### Checklist pós-deploy Vercel

- [ ] Rotas diretas (`/admin`, `/politica-de-privacidade`) não retornam 404
- [ ] `VITE_PUBLIC_SITE_URL` bate com a URL do deploy (canonical/OG corretos)
- [ ] Se usar URL Vercel na Meta temporariamente, atualize depois para o domínio HostGator

---
 
## 11. Keep-alive do Supabase (plano gratuito)
 
Projetos no plano gratuito pausam após inatividade. A **Edge Function `keep-alive`** faz um ping diário para manter o projeto ativo.
 
### Configuração (única vez)
 
#### A) Instalar o Supabase CLI (Mac)
 
```bash
brew install supabase/tap/supabase
supabase --version  # Confirma instalação
```
 
#### B) Encontrar o Reference ID do projeto
 
No [Supabase Dashboard](https://supabase.com): **Project Settings → General → Reference ID**  
Exemplo: `abcdxyz123`
 
#### C) Linkar a pasta ao projeto
 
```bash
cd ~/caminho/para/dona-rosa-pizzaria
supabase login                          # Abre o navegador para autenticar
supabase link --project-ref SEU_REF     # Vincula ao projeto
```
 
#### D) Criar o segredo da função
 
```bash
supabase secrets set KEEP_ALIVE_SECRET=SUA_SENHA_LONGA_AQUI
```
 
Guarde essa senha — você vai precisar dela no próximo passo.
 
#### E) Publicar a Edge Function
 
```bash
supabase functions deploy keep-alive --project-ref SEU_REF
```
 
#### F) Testar
 
Acesse no navegador:
```
https://SEU_REF.supabase.co/functions/v1/keep-alive?secret=SUA_SENHA_LONGA_AQUI
```
Resposta esperada: `{"ok":true,"pinged_at":"..."}`
 
#### G) Configurar agendamento no GitHub
 
Em **Settings → Secrets and variables → Actions**, crie:
 
| Secret | Valor |
|---|---|
| `SUPABASE_FUNCTIONS_URL` | `https://SEU_REF.supabase.co/functions/v1` |
| `KEEP_ALIVE_SECRET` | A mesma senha longa do passo D |
 
O workflow `.github/workflows/supabase-keep-alive.yml` já agenda o ping **diariamente às 08:00 UTC**. Se os secrets ainda não estiverem definidos, o job **termina com sucesso** e regista um aviso no log (evita falha diária no GitHub até configurares o passo G).
 
Para testar manualmente: **Actions → Supabase keep-alive → Run workflow**
 
> ⚠️ Se o projeto já estiver pausado, reative manualmente no Dashboard antes de depender desta função.

---

## 12. Supabase CLI — linkar projeto e migrations

O **Reference ID** do projeto remoto está em `supabase/config.toml` (`project_id`). Siga estes passos **uma vez** para vincular sua máquina e aplicar migrations / gerar tipos.

### A) Instalar o Supabase CLI (Mac)

```bash
brew install supabase/tap/supabase
supabase --version
```

### B) Autenticar e linkar

```bash
cd ~/caminho/para/dona-rosa-pizzaria
supabase login                    # abre o navegador — use a conta com acesso ao projeto
supabase link --project-ref SEU_REF   # mesmo valor de project_id em config.toml
```

Quando pedir a **database password**, use a senha do Postgres do projeto (Dashboard → **Project Settings → Database**). Ela fica salva localmente em `supabase/.temp` (já está no `.gitignore`).

Confirme o vínculo:

```bash
supabase projects list
# deve aparecer ● linked ao lado do projeto
```

### C) Variáveis do front-end (`.env`)

O CLI **não** substitui o `.env` do Vite. Mantenha preenchido:

| Variável | Onde achar |
|---|---|
| `VITE_SUPABASE_URL` | Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Settings → API → anon public |
| `VITE_PUBLIC_SITE_URL` | URL do ambiente de build (HostGator ou Vercel) |

### D) Comandos do dia a dia

| Comando | O que faz |
|---|---|
| `npm run db:status` | Lista migrations locais vs. remoto (quais já foram aplicadas) |
| `npm run db:push` | Aplica **somente migrations pendentes** no banco remoto |
| `npm run db:types` | Regenera `src/integrations/supabase/types.ts` a partir do banco linkado |

Fluxo típico ao criar uma migration nova:

```bash
# 1. Crie o arquivo em supabase/migrations/YYYYMMDDHHmmss_descricao.sql
# 2. Revise o SQL
npm run db:status    # confirme que aparece como "pending" no remoto
npm run db:push      # aplica no Supabase remoto
npm run db:types     # atualiza tipos TypeScript
```

> ⚠️ **Nunca** altere o banco manualmente no Dashboard sem criar a migration correspondente no Git.

> ⚠️ **Não** rode `supabase/schema-baseline.reference.sql` em produção — é só documentação do schema que existia antes da primeira migration versionada.

### E) Ambiente local opcional (Docker)

Para testar migrations sem tocar no remoto:

```bash
supabase start          # sobe Postgres + Auth local via Docker
supabase db reset       # aplica todas as migrations do zero
supabase stop           # para os containers
```

Requer [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

### F) Sincronizar se o remoto estiver à frente do repo

Se alguém alterou o banco direto no Dashboard e você precisa trazer para o código:

```bash
supabase db pull      # gera migration com o diff (revisar antes de commitar)
npm run db:types
```

Use com cuidado — revise o SQL gerado antes de commitar.

### G) Problema: `Remote migration versions not found in local migrations directory`

Isso acontece quando o banco remoto foi migrado com **timestamps diferentes** dos arquivos no Git (comum ao aplicar pelo Dashboard ou Lovable).

**Sintoma:** remoto tem `20260323213931`, local tem `20260323213934` (+3 segundos).

**Solução (já aplicada neste projeto):**

```bash
npm run db:repair    # reverte fantasmas + marca equivalentes locais como applied
npm run db:deploy    # push --yes + db:types
```

Ou manualmente:

```bash
supabase migration repair --status reverted 20260323213931 20260323223045 20260324000705
supabase migration repair --status applied 20260323213934 20260323223047 20260324000708
npm run db:push:yes
npm run db:types
```

> ⚠️ **Nunca** marque como `applied` migrations que ainda não rodaram no banco — isso pula SQL. Use `repair --status applied` só para alinhar nomes de migrations **já executadas**.

### H) Ambiente local com Docker (testar migrations sem remoto)

Requer [Docker Desktop](https://www.docker.com/products/docker-desktop/) + Supabase CLI.

**Portas deste projeto (offset +10):** não conflita com `auto-painel` nas portas padrão.

| Serviço | URL/porta |
|---|---|
| Studio | http://127.0.0.1:54333 |
| API | http://127.0.0.1:54331 |
| Postgres | `localhost:54332` |

```bash
npm run db:local:start   # sobe stack local (portas 54331+)
npm run db:local:reset   # recria banco e aplica TODAS as migrations
npm run db:local:status  # URLs e keys locais
npm run db:local:stop    # para containers deste projeto
```

Se preferir usar as portas padrão (54321–54324), pare o outro projeto primeiro:

```bash
supabase stop --project-id auto-painel
npm run db:local:start
```

### I) Fluxo recomendado ao criar migration nova

```bash
# 1. Crie supabase/migrations/YYYYMMDDHHmmss_descricao.sql
npm run db:status          # deve aparecer como pending no remoto
npm run db:deploy          # push + types
git add supabase/migrations/ src/integrations/supabase/types.ts
git commit -m "feat(db): ..."
```

---

## 13. WhatsApp — integração (infra Supabase)

Módulo de mensagens, templates e campanhas via WhatsApp Business API (Meta). Dados em Postgres com RLS; processamento em Edge Functions.

### Secrets (Supabase — nunca no `.env` do Vite)

```bash
cp supabase/secrets.meta.env.example supabase/secrets.meta.env
# preencha os valores com a proprietária / Meta Business, depois:
npm run secrets:meta
```

Variáveis típicas: `META_APP_SECRET`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_VERIFY_TOKEN`. Opcionais: `META_WABA_ID`, `META_API_VERSION` (default `v21.0`). Em homologação: `BROADCAST_DRY_RUN=true` (simula envio sem chamar a Graph API).

Detalhes e exemplos: `supabase/secrets.meta.env.example` e scripts em `scripts/`.

### Fase 1 — infraestrutura (concluída)

| Entrega | Descrição |
|---|---|
| `whatsapp-webhook` | GET hub.challenge + POST com HMAC; processamento assíncrono (`EdgeRuntime.waitUntil`) |
| Idempotência | Coluna `dedupe_key` em `whatsapp_webhook_events` — reenvios Meta não duplicam CRM |
| `whatsapp-verify` | Health-check protegido por `?secret=META_VERIFY_TOKEN` |
| CRM base | `whatsapp_config`, conversas, mensagens, log de eventos |
| Front | `useWhatsappConnectionStatus` — status no backoffice |

```bash
npm run meta:verify          # webhook + HMAC + whatsapp-verify + Graph API + secrets
```

URL do health-check (substitua o secret pelo valor de `META_VERIFY_TOKEN`):

```
https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-verify?secret=SEU_VERIFY_TOKEN
```

Resposta esperada quando tudo OK: `{ "ok": true, "meta": { "token_valid": true, ... } }`.

### Migration e Edge Functions

```bash
npm run db:status
npm run db:push:yes
npm run db:types
npm run functions:deploy:whatsapp   # webhook, verify, broadcast, templates, send-message
```

URL do webhook (substitua `SEU_REF` pelo Reference ID do projeto):

```
https://SEU_REF.supabase.co/functions/v1/whatsapp-webhook
```

Configure no [Meta for Developers](https://developers.facebook.com) → WhatsApp → Webhook (Callback URL + Verify Token).

### Coexistência WhatsApp (celular + painel)

**Guia completo:** [`docs/COEXISTENCIA-WHATSAPP.md`](docs/COEXISTENCIA-WHATSAPP.md)

**Não** mover o app Dona Rosa Piuzza para outro portfólio (ex.: Janaina Developer) — a cobrança do WhatsApp permanece na conta **Dona Rosa Pizzaria** no Gerenciador.

1. Token do portfólio **Dona Rosa** (Usuário do sistema) → `supabase/secrets.meta.env` → `npm run secrets:meta`
2. `npm run meta:coexistence` e `npm run meta:verify`
3. Celular: WhatsApp Business → **Plataforma comercial** → Conectar (não use verificação SMS no Gerenciador)
4. Até `CONNECTED` + `CLOUD_API` em `meta:verify`

Popup **Iniciar conexão** no admin é opcional; com app e pizzaria no mesmo portfólio a Meta costuma bloquear — use o celular.

Se o app foi movido por engano, reverta para Dona Rosa: [ajuda Meta](https://www.facebook.com/business/help/236817717885919).

### Backoffice

| Rota | Função |
|---|---|
| `/admin/conversas` | Inbox |
| `/admin/templates` | Modelos de mensagem |
| `/admin/disparos` | Campanhas |
| `/admin/contatos` | Importação CSV + lista de contatos |

### Módulos WhatsApp (fases 1–4 — concluídos no código)

| Módulo | Entregas principais |
|---|---|
| Infra | `whatsapp-webhook`, `whatsapp-verify`, HMAC, dedupe, CRM base |
| Contatos | `/admin/contatos`, CSV/Excel, LGPD, etiquetas, segmentos, homologação QA |
| Templates | `/admin/templates`, `whatsapp-templates`, preview WhatsApp |
| Disparos | `/admin/disparos`, `broadcast-send`, rate limit, dry-run |
| Pesquisas | `/admin/pesquisas`, `survey_flows`, respostas sequenciais, relatório + CSV |
| Inbox | `/admin/conversas`, envio manual `whatsapp-send-message` |

Opt-in do site: Edge Function `register-site-consent` (não expõe RPC `SECURITY DEFINER` na API pública).

**Bloqueio externo:** envio real e submissão de templates dependem de **App Review Meta** — manter `BROADCAST_DRY_RUN=true` até go-live.

```bash
npm run functions:deploy:whatsapp   # inclui register-site-consent
npm run test:regression              # regressão E2E (CMS intocado)
npm run homologacao:post-deploy      # smoke pós-deploy
```

### Documentação

| Doc | Público |
|---|---|
| [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md) | Desenvolvedores — setup, scripts, estrutura |
| [docs/FASES-ENTREGA.md](docs/FASES-ENTREGA.md) | Status das fases 1–5 |
| [docs/SEGURANCA-AUTH.md](docs/SEGURANCA-AUTH.md) | Auth, warnings Supabase, HostGator |
| [docs/GUIA-ROSA-WHATSAPP.md](docs/GUIA-ROSA-WHATSAPP.md) | Rosa — uso do painel |
| [docs/HOMOLOGACAO-T01-T30.md](docs/HOMOLOGACAO-T01-T30.md) | QA — checklist go-live |
| [docs/PESQUISAS-WHATSAPP.md](docs/PESQUISAS-WHATSAPP.md) | Arquitetura técnica pesquisas |
| [docs/COEXISTENCIA-ROSA-E-PC.md](docs/COEXISTENCIA-ROSA-E-PC.md) | Coexistência celular + PC |

## 14. Convenções técnicas — não quebre isso

| Convenção | Por quê importa |
|---|---|
| Guards de carregamento (`useHomeBootstrap` / `useSiteShellReady`) | Evita flash de placeholder no primeiro paint |
| Conteúdo público via Supabase (rascunho vs. publicado) | CMS independente de deploy do front |
| `VITE_PUBLIC_SITE_URL` correto no build de cada ambiente | Canonical, JSON-LD, OG e links de e-mail |
| Fallback SPA: `.htaccess` (HostGator) + `vercel.json` (Vercel) | Rotas diretas sem 404 |
| Migrations versionadas em `supabase/migrations/` | Schema reprodutível |
| Auth helpers no schema `private`; RPC pública `am_i_admin()` | Menor superfície de ataque |
| Secrets Meta e service role **somente** no Supabase | Nunca em `VITE_*` nem no Git |
| `/admin` e `/login` com `noindex` | Rotas privadas fora do índice |
| Em QA: preferir rascunho/preview; evitar “Publicar” no CMS | Não alterar site público sem OK da operação |

---

## 15. Checklist de QA — painel administrativo

Última rodada automatizada: **regressão E2E** (`npm run test:regression`) — site público read-only + rotas admin sem alterar CMS.

| Comando | Escopo |
|---|---|
| `npm run test` | Vitest (unit) |
| `npm run test:e2e:smoke` | Smoke admin (login, rotas) |
| `npm run test:regression` | Regressão completa documentada em `docs/qa-sample/` |
| `npm run homologacao:post-deploy` | T03 + vitest + smoke pós-deploy |

Homologação manual com celulares reais: [docs/HOMOLOGACAO-T01-T30.md](docs/HOMOLOGACAO-T01-T30.md).

---

## 16. Segurança e autenticação

Guia completo: **[docs/SEGURANCA-AUTH.md](docs/SEGURANCA-AUTH.md)**

Resumo:

| Warning Supabase | Ação |
|---|---|
| `register_whatsapp_site_consent` SECURITY DEFINER público | Migration `20260609130000` + Edge Function `register-site-consent` |
| Leaked password protection disabled | Dashboard → Auth → Email → habilitar (requer Pro em alguns planos) |

**HostGator:** serve apenas o front-end estático. Senhas do painel ficam no **Supabase Auth**. Passo a passo HTTPS, deploy SPA e redirects: seção 10 deste README + `docs/SEGURANCA-AUTH.md`.

```bash
npm run db:deploy
npm run functions:deploy:site-consent
```

---

## 17. Onde pedir ajuda / credenciais

- **Credenciais** (Supabase, HostGator, Vercel, GitHub, Meta Business, variáveis de ambiente): solicitar diretamente à **proprietária da pizzaria**.
- **Dúvidas técnicas sobre a implementação**: contato com a desenvolvedora responsável — [Janaina Guiotti](https://janaina-guiotti.vercel.app/).

---
 
*Desenvolvido com ❤️ por [Janaina Guiotti](https://janaina-guiotti.vercel.app/)*
 
