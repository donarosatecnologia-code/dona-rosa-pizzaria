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
12. [Regras de negócio — não quebre isso](#12-regras-de-negócio--não-quebre-isso)
13. [Onde pedir ajuda / credenciais](#13-onde-pedir-ajuda--credenciais)
 
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
│   └── migrations/     # Esquema e seeds do banco — versionar sempre!
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
 
- Rota: `/admin` e `/login`
- **Autenticação via Supabase Auth** — não há usuário hardcoded.
- Essas rotas são marcadas com `noindex` (não aparecem em buscadores).
- Para criar ou resetar acesso admin, use o painel do Supabase (Authentication → Users).
 
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
 
O workflow `.github/workflows/supabase-keep-alive.yml` já agenda o ping **diariamente às 08:00 UTC**.
 
Para testar manualmente: **Actions → Supabase keep-alive → Run workflow**
 
> ⚠️ Se o projeto já estiver pausado, reative manualmente no Dashboard antes de depender desta função.
 
---
 
## 12. Regras de negócio — não quebre isso
 
| Regra | Por quê importa |
|---|---|
| Manter guards de carregamento (`useHomeBootstrap` / `useSiteShellReady`) | Evita placeholders vazios em produção |
| `/admin` e `/login` com `noindex` | Não devem ser indexados por buscadores |
| Conteúdo vem do Supabase, nunca hardcoded | Permite que a proprietária edite sem deploy |
| `VITE_PUBLIC_SITE_URL` correto por ambiente | Canonical, JSON-LD e OG dependem disso |
| Migrations versionadas em `supabase/migrations/` | Rastreabilidade e reprodutibilidade do banco |
| Nunca commitar `.env` ou service role key | Segurança — credenciais não vão para o repo |
| `vercel.json` com rewrite SPA | Sem isso, rotas diretas (ex: `/cardapio`) retornam 404 |
 
---
 
## 13. Onde pedir ajuda / credenciais
 
- **Credenciais** (Supabase, Vercel, GitHub, variáveis de ambiente): solicitar diretamente à **proprietária da pizzaria**.
- **Dúvidas técnicas sobre a implementação**: contato com a desenvolvedora responsável — [Janaina Guiotti](https://janaina-guiotti.vercel.app/).
 
---
 
*Desenvolvido com ❤️ por [Janaina Guiotti](https://janaina-guiotti.vercel.app/)*
 
