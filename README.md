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
10. [Deploy na Vercel](#10-deploy-na-vercel)
11. [Keep-alive do Supabase (plano gratuito)](#11-keep-alive-do-supabase-plano-gratuito)
12. [Supabase CLI — linkar projeto e migrations](#12-supabase-cli--linkar-projeto-e-migrations)
13. [WhatsApp — Disparos Ativos (infra Supabase)](#13-whatsapp--disparos-ativos-infra-supabase)
14. [Regras de negócio — não quebre isso](#14-regras-de-negócio--não-quebre-isso)
15. [Onde pedir ajuda / credenciais](#15-onde-pedir-ajuda--credenciais)
16. [Checklist de QA — painel administrativo](#16-checklist-de-qa--painel-administrativo)
 
---
 
## 1. Visão geral da stack
 
| Camada | Tecnologia |
|---|---|
| Front-end | React + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Dados assíncronos | TanStack Query |
| Backend / CMS / Auth | Supabase |
| Hospedagem | Vercel |
 
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
| `VITE_PUBLIC_SITE_URL` | URL canônica do site em produção | Ex.: `https://www.donarosa.com.br` |
 
**Regras importantes:**
- Nunca commite o arquivo `.env` (já está no `.gitignore`).
- Nunca use a *service role key* no front-end — apenas a chave **anon**.
- Em desenvolvimento, `VITE_PUBLIC_SITE_URL` pode ficar vazio (usa `window.location.origin`).
- As credenciais reais devem ser solicitadas **diretamente à proprietária da pizzaria**.
 
---
 
## 4. Scripts disponíveis
 
```bash
npm run dev       # Servidor local com hot-reload (porta 8080)
npm run build     # Build de produção (gera pasta dist/)
npm run preview   # Serve o build localmente para teste
npm run lint      # Verifica qualidade do código com ESLint
npm run test      # Roda os testes com Vitest
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
│   ├── robots.txt
│   ├── sitemap.xml     # ⚠️ Atualizar URL base antes do go-live
│   └── llms.txt        # Resumo do site para agentes de IA
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
 
O projeto usa `react-router-dom`. O arquivo `vercel.json` já inclui a regra de rewrite que redireciona todas as rotas para `index.html` — necessário para o roteamento client-side funcionar após deploy.
 
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
| `/admin/contatos` | Clientes | CRM |
| `/admin/templates` | Mensagens prontas | Modelos Meta |
| `/admin/disparos` | Promoções | Campanhas |
| `/admin/disparos/:id` | Promoções | Detalhe da campanha |
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
 
## 10. Deploy na Vercel
 
### Configuração inicial (só na primeira vez)
 
1. Acesse [vercel.com](https://vercel.com) com a conta autorizada.
2. **Add New → Project** → importe o repositório `dona-rosa-pizzaria`.
3. Configure:
   - **Framework:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Em **Settings → Environment Variables**, adicione as 3 variáveis (seção 3) para os ambientes `Production`, `Preview` e `Development`.
 
### Deploy contínuo
 
- Basta fazer **merge na branch principal** — a Vercel deploya automaticamente.
 
### Checklist pós-deploy
 
- [ ] Navegação entre rotas internas funciona
- [ ] Home e páginas internas carregam sem placeholder
- [ ] `<title>` e `meta description` estão corretos por página
- [ ] Área `/admin` abre e solicita login
- [ ] `sitemap.xml` e `robots.txt` estão acessíveis
 
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

O repositório já aponta para o projeto remoto em `supabase/config.toml` (`project_id = pptgzavxpdltcuqpcovo`). Siga estes passos **uma vez** para vincular sua máquina e poder aplicar migrations e gerar tipos quando quiser.

### A) Instalar o Supabase CLI (Mac)

```bash
brew install supabase/tap/supabase
supabase --version
```

### B) Autenticar e linkar

```bash
cd ~/caminho/para/dona-rosa-pizzaria
supabase login                    # abre o navegador — use a conta com acesso ao projeto
supabase link --project-ref pptgzavxpdltcuqpcovo
```

Quando pedir a **database password**, use a senha do Postgres do projeto (Dashboard → **Project Settings → Database → Database password**). Ela fica salva localmente em `supabase/.temp` (já está no `.gitignore`).

Confirme o vínculo:

```bash
supabase projects list
# deve aparecer ● linked ao lado do projeto Dona Rosa
```

### C) Variáveis do front-end (`.env`)

O CLI **não** substitui o `.env` do Vite. Mantenha preenchido:

| Variável | Onde achar |
|---|---|
| `VITE_SUPABASE_URL` | Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Settings → API → anon public |
| `VITE_PUBLIC_SITE_URL` | URL de produção (ex.: `https://www.donarosa.com.br`) |

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

## 13. WhatsApp — Disparos Ativos (infra Supabase)

Módulo de campanhas ativas via WhatsApp Business. Tabelas: `whatsapp_contacts`, `broadcast_campaigns`, `broadcast_campaign_recipients`, `survey_responses`.

### Secrets (Supabase — nunca no `.env` do Vite)

```bash
cp supabase/secrets.meta.env.example supabase/secrets.meta.env
# preencha os 4 valores, depois:
npm run secrets:meta
```

Ou individualmente:

```bash
supabase secrets set META_APP_SECRET=...
supabase secrets set META_ACCESS_TOKEN=...
supabase secrets set META_PHONE_NUMBER_ID=...
supabase secrets set META_VERIFY_TOKEN=...
```

### Aplicar migration e deploy do webhook

```bash
npm run db:status
npm run db:push:yes
npm run db:types
npm run functions:deploy:webhook
```

URL do webhook para a Meta:

```
https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-webhook
```

### Configurar no Meta Business Manager

1. [developers.facebook.com](https://developers.facebook.com) → App → WhatsApp → Configuration → Webhook
2. **Callback URL:** URL acima
3. **Verify Token:** mesmo valor de `META_VERIFY_TOKEN`
4. Campos ativos: `messages`, `message_deliveries` (e `message_reads` se disponível)

### Draft vs. publicado (campanhas)

- Edição grava em `*_draft` (template, params, **content_type**, **queue_id**)
- RPC `publish_broadcast_campaign(id)` consolida para colunas publicadas
- **Motor de envio** lê apenas colunas publicadas + `resolve_queue_contact_ids(queue_id)`

### Tags, filas e engajamento

| Conceito | Tabela | Descrição |
|---|---|---|
| Tag | `whatsapp_tags` | Etiqueta atribuível ao contato (manual ou sistema) |
| Tag no contato | `whatsapp_contact_tags` | M:N contato ↔ tag |
| Fila | `whatsapp_queues` | Segmento nomeado (ex.: Clientes ativos) |
| Regra da fila | `whatsapp_queue_tags` | Tags `include` / `exclude` + modo `any`/`all` |
| Engajamento | `whatsapp_contacts.engagement_level` | active / warm / cold / unknown |
| Resolver fila | `resolve_queue_contact_ids(uuid)` | IDs elegíveis para disparo |

**Tags sistema (automáticas):** `cliente-ativo`, `cliente-inativo` — recalculadas via `refresh_contact_engagement` no webhook.

**Tipos de conteúdo:** `survey`, `promotion`, `informational`, `utility`, `reminder`.

**Respostas inbound:** tabela `broadcast_responses` (não só pesquisas).

### Realtime (backoffice)

Canal privado: `admin:whatsapp:broadcasts` · evento: `broadcast_response_received`

### CRM de conversas

Tabelas: `whatsapp_config`, `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_webhook_events`.

**Backoffice (`/admin`):**

| Rota | Função |
|---|---|
| `/admin/conversas` | Inbox — lista conversas com preview e status |
| `/admin/conversas/:id` | Thread de mensagens inbound/outbound |
| `/admin/templates` | Modelos — criar, enviar para aprovação Meta, ver status |
| `/admin/disparos` | Campanhas — criar (só modelos aprovados), publicar, disparar |

Realtime CRM: canal `admin:whatsapp:crm`.

### Modo desenvolvimento vs. go-live (entrega BR)

Número de teste Meta (+1 555…) **não entrega** para celulares BR (erro Meta `131031`). Até conectar número brasileiro real:

1. **`BROADCAST_DRY_RUN=true`** (secret Supabase) — `broadcast-send` grava `sent` + `meta_message_id` simulado (`dry_run_…`) e persiste no CRM **sem** chamar Graph API.
2. Recebimento (celular → webhook → CRM) continua funcionando normalmente.
3. UI exibe banner de modo dev e botão **Disparar (simulado)**.

**Homologação / go-live:**

```bash
# Em supabase/secrets.meta.env
BROADCAST_DRY_RUN=false
npm run secrets:meta
npm run functions:deploy:broadcast-send
```

Use número BR verificado no WhatsApp Manager antes de desligar o dry-run.

### Modelos de mensagem (Meta)

Tabela `whatsapp_templates` · Edge Function `whatsapp-templates` (submit + sync).

**Fluxo para a Rosa (sem usar o painel Meta):**
1. `/admin/templates` → **Novo modelo** → escrever texto com `{{1}}` para nome do cliente
2. **Enviar para aprovação** → status `pending`
3. **Atualizar status** (ou automático via webhook) → `approved` ou `rejected` + motivo
4. Modelo aprovado aparece em **Disparos → Nova campanha**

**Webhook Meta:** ative o campo `message_template_status_update` junto com `messages` e `message_deliveries`.

**Token Meta:** precisa de permissão `whatsapp_business_management` para criar/listar templates.


## 14. Regras de negócio — não quebre isso
 
| Regra | Por quê importa |
|---|---|
| Manter guards de carregamento (`useHomeBootstrap` / `useSiteShellReady`) | Evita placeholders vazios em produção |
| `/admin` e `/login` com `noindex` | Não devem ser indexados por buscadores |
| Conteúdo vem do Supabase, nunca hardcoded | Permite que a proprietária edite sem deploy |
| `VITE_PUBLIC_SITE_URL` correto por ambiente | Canonical, JSON-LD e OG dependem disso |
| Migrations versionadas em `supabase/migrations/` | Rastreabilidade e reprodutibilidade do banco |
| Nunca commitar `.env` ou service role key | Segurança — credenciais não vão para o repo |
| `vercel.json` com rewrite SPA | Sem isso, rotas diretas (ex: `/cardapio`) retornam 404 |
| Helpers de auth no schema `private` | Não expor `is_admin(uuid)` via RPC — usar `am_i_admin()` |
| Não publicar CMS em testes de QA | Rascunhos ≠ site público; publicar só com OK da Rosa |

---

## 16. Checklist de QA — painel administrativo

Última rodada: **2026-06-02** · ambiente local `http://localhost:8080` · **nenhum conteúdo publicado** (cardápio, páginas, topo/rodapé intactos).

### Automatizado (passou)

| Teste | Resultado |
|---|---|
| `/admin/dashboard` sem sessão → tela de login | ✅ |
| Cardápio público carrega produtos do Supabase | ✅ |
| Home com guard de carregamento | ✅ |
| `npm run test` (9 testes) | ✅ |
| `npm run build` | ✅ (rodada anterior) |
| Webhook sem assinatura HMAC → HTTP 403 | ✅ |
| `whatsapp-send-message` sem JWT → HTTP 401 | ✅ |
| `admin-users` sem JWT → HTTP 401 | ✅ |
| RPC `is_admin` removida da API | ✅ |
| RPC `am_i_admin` negada para anon | ✅ |

### Segurança Supabase / WhatsApp

| Item | Status |
|---|---|
| HMAC `X-Hub-Signature-256` antes de persistir | ✅ (`meta-webhook.ts`) |
| Comparação timing-safe | ✅ |
| RLS em tabelas WhatsApp | ✅ (migrations) |
| Edge Functions sensíveis com `verify_jwt = true` | ✅ (`config.toml`) |
| Secrets Meta só no Supabase (não `VITE_*`) | ✅ |

### Manual — requer login admin (Rosa / super admin)

Executar logado, **sem clicar em Publicar** em CMS/cardápio/topo e rodapé:

1. [ ] Dashboard: cards e gráficos carregam sem erro 400 no console
2. [ ] Header: nome da equipe ao lado do avatar (não e-mail)
3. [ ] Mensagens: lista conversas; abrir thread; banner janela 24h se aplicável
4. [ ] Clientes: listar, buscar, importar (cancelar antes de confirmar)
5. [ ] Mensagens prontas: listar modelos; criar rascunho; **não** submeter à Meta
6. [ ] Promoções: listar campanhas; abrir detalhe; **não** disparar
7. [ ] Páginas do site: links espelho/preview abrem; **Salvar rascunho** ok; **não Publicar**
8. [ ] Cardápio admin: editar produto em rascunho; **não Publicar**
9. [ ] Topo e rodapé: visualizar; **não Publicar**
10. [ ] Equipe: listar; editar permissões de teste; **não** excluir super admin
11. [ ] Minha conta: alterar nome; refletir no header
12. [ ] Notificações: abrir sheet; marcar lida / dispensar
13. [ ] Logout → `/login`; voltar a `/admin` exige login

### Findings desta rodada

| # | Severidade | Descrição | Status |
|---|---|---|---|
| 1 | 🟡 minor | Título da aba em `/login` e `/recuperar-senha` mostra "Página não encontrada" (falta entrada em `PAGE_SEO`) | ✅ corrigido |
| 2 | 🟡 minor | `npm run lint` — 5 erros pré-existentes (não bloqueiam build) | ✅ corrigido (0 erros) |
| 3 | 🔵 obs | Commit histórico `db09cff` incluiu `.env` — revisar rotação de chaves se repo foi público | registrado |
| 4 | 🔵 obs | HaveIBeenPwned: requer plano Pro + toggle no Dashboard Auth | pendente infra |
| 5 | 🔴 blocker | `get_admin_dashboard_stats` 400 (`deleted_at` inexistente em `whatsapp_contacts`) | ✅ corrigido |

### Sprint Review (QA)

**Entregue neste ciclo:** painel admin com RBAC, dashboard, equipe, auth (convite/recuperar senha), templates de e-mail, hardening Security Advisor (schema `private`, storage, MFA TOTP).

**Riscos:** fluxos autenticados dependem de validação manual com credencial real; lint com erores legados; histórico git com `.env`.

**Próximo sprint:** corrigir SEO de rotas auth; rodada E2E logada com Playwright; habilitar HIBP se plano Pro.

---
 
## 15. Onde pedir ajuda / credenciais
 
- **Credenciais** (Supabase, Vercel, GitHub, variáveis de ambiente): solicitar diretamente à **proprietária da pizzaria**.
- **Dúvidas técnicas sobre a implementação**: contato com a desenvolvedora responsável — [Janaina Guiotti](https://janaina-guiotti.vercel.app/).
 
---
 
*Desenvolvido com ❤️ por [Janaina Guiotti](https://janaina-guiotti.vercel.app/)*
 
