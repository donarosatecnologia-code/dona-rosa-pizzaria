# Segurança e autenticação

Guia para desenvolvedores: warnings do Supabase Security Advisor, auth do painel e o que configurar na HostGator vs no Supabase.

---

## Onde fica cada responsabilidade

| O quê | Onde roda |
|---|---|
| Login do painel `/admin` | **Supabase Auth** (e-mail + senha, MFA opcional) |
| Senhas da equipe | **Supabase** — não são armazenadas na HostGator |
| Site estático (HTML/JS) | **HostGator** — só arquivos do `dist/` |
| API WhatsApp, webhook, disparos | **Supabase Edge Functions** |
| Dados (contatos, campanhas) | **Postgres Supabase** com RLS |

A HostGator **não** protege senha do admin. Ela só serve o front-end. Toda autenticação passa pelo Supabase.

---

## Warning 1 e 2: `register_whatsapp_site_consent` (SECURITY DEFINER público)

### Problema

A função `public.register_whatsapp_site_consent` era `SECURITY DEFINER` e executável via `/rest/v1/rpc/` por `anon` e `authenticated`. O Security Advisor alerta porque funções elevadas não devem ficar expostas na API REST pública.

### Correção aplicada

1. Função movida para `private.register_whatsapp_site_consent` (não exposta no PostgREST).
2. Nova Edge Function `register-site-consent` (`verify_jwt = false`) valida payload e chama a RPC com **service role**.
3. Front-end (`registerSiteConsent.ts`) usa `supabase.functions.invoke('register-site-consent')`.

### Deploy da correção

```bash
npm run db:deploy
npm run functions:deploy:site-consent
```

Após deploy, os dois warnings de SECURITY DEFINER devem sumir no Security Advisor.

---

## Warning 3: Leaked Password Protection Disabled

### O que é

O Supabase Auth pode recusar senhas que aparecem em vazamentos públicos (integração Have I Been Pwned).

### Como habilitar (Supabase Dashboard)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) → projeto Dona Rosa.
2. **Authentication** → **Providers** → **Email**.
3. Ative **Prevent the use of leaked passwords** (nome pode variar: "Leaked password protection").
4. Salve.

> **Nota:** em alguns planos essa opção exige **Supabase Pro**. No plano Free o toggle pode não aparecer ou ficar desabilitado. Nesse caso, documente como risco aceito até upgrade.

### Complemento recomendado (sem custo extra)

- Exigir senhas fortes na criação de usuários (mínimo 12 caracteres na política interna).
- Habilitar **MFA TOTP** para super admins (`config.toml` já tem `[auth.mfa.totp]`).
- No painel: **Authentication** → usuário → convidar com senha temporária → forçar troca em `/admin/trocar-senha`.

---

## Configuração de auth para produção (Supabase)

### URLs de redirect

Arquivo local: `supabase/config.toml` (`site_url`, `additional_redirect_urls`).

Sincronizar com o remoto:

```bash
supabase config push --yes
```

Confirmar no Dashboard: **Authentication → URL Configuration**

| Campo | Valor produção |
|---|---|
| Site URL | `https://donarosapizzaria.com.br` |
| Redirect URLs | `/redefinir-senha`, `/admin`, `/login` no domínio acima |

### Secret para e-mails de convite

```bash
supabase secrets set PUBLIC_SITE_URL=https://donarosapizzaria.com.br
```

Usado pela Edge Function `admin-users` nos links de convite.

---

## HostGator — passo a passo (o que fazer no servidor)

A HostGator **não** configura senha do painel admin. Siga estes passos para o ambiente estar seguro e compatível com Supabase Auth:

### 1. HTTPS obrigatório (SSL)

1. cPanel → **SSL/TLS Status** ou **Let's Encrypt**.
2. Ative certificado para `donarosapizzaria.com.br` e `www` (se usar).
3. cPanel → **Domínios** → redirecionar HTTP → HTTPS (opcional mas recomendado).

Sem HTTPS, cookies de sessão e redirects do Supabase Auth podem falhar.

### 2. Deploy do front-end (sem credenciais no servidor)

```bash
npm run build:hostgator
```

Upload do conteúdo de `dist/` para `public_html/`:

- `index.html`
- pasta `assets/`
- `.htaccess` (fallback SPA — **obrigatório**)
- `robots.txt`, `sitemap.xml`

**Nunca** envie `.env` para a HostGator. Só variáveis `VITE_*` entram no build no seu computador/CI.

### 3. Validar SPA e rotas de auth

```bash
npm run verify:hostgator
```

Testar manualmente:

- `https://donarosapizzaria.com.br/login`
- `https://donarosapizzaria.com.br/admin` → redireciona para login
- Recuperar senha → e-mail com link para `/redefinir-senha`
- F5 em rotas internas não deve dar 404 da HostGator

### 4. Não usar Basic Auth do Apache no `/admin`

Evite `.htaccess` com `AuthType Basic` em `/admin`. Isso adiciona uma segunda camada de senha confusa para a Rosa e não integra com Supabase Auth/RBAC.

A proteção correta é: **Supabase Auth + RLS + guards no React Router**.

### 5. Permissões de arquivo (opcional)

No Gerenciador de Arquivos:

- Arquivos: `644`
- Pastas: `755`
- `.htaccess` na raiz de `public_html/`

---

## Checklist rápido de segurança

| Item | Status esperado |
|---|---|
| RPC `register_whatsapp_site_consent` removida do schema `public` | Após migration 20260609130000 |
| Edge Function `register-site-consent` deployada | `npm run functions:deploy:site-consent` |
| Secrets Meta só no Supabase | ✅ |
| `verify_jwt = true` em funções admin (`broadcast-send`, etc.) | ✅ `config.toml` |
| RLS em tabelas sensíveis | ✅ migrations |
| `/admin` e `/login` com `noindex` | ✅ `SeoShell` |
| HTTPS na HostGator | Verificar no cPanel |
| Leaked password protection | Habilitar no Dashboard (Pro) |
| MFA para super admins | Recomendado |

---

## Referências

- [Supabase Auth — Password security](https://supabase.com/docs/guides/auth/password-security)
- [Security Advisor](https://supabase.com/docs/guides/database/database-linter)
- Deploy HostGator: seção 10 do [README.md](../README.md)
