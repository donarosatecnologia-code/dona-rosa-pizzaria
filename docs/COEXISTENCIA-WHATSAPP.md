# Coexistência WhatsApp — Dona Rosa Pizzaria (guia oficial)

Objetivo: **celular da pizzaria continua funcionando** e **mensagens aparecem no painel** (`/admin/conversas`).

**Não é necessário** mover o app para outro portfólio (ex.: Janaina Developer).  
**Não é necessário** cadastrar forma de pagamento de novo — cobrança do WhatsApp segue na conta **Dona Rosa Pizzaria** no Gerenciador do WhatsApp.

---

## O que NÃO fazer

| Ação | Por quê |
|------|---------|
| Mover app Dona Rosa Piuzza para outro portfólio | Quebra token, pode pedir pagamento/verificação no portfólio errado |
| Gerenciador → “Verificar número” por SMS | Fluxo de número **novo**; gera erro #2655122 |
| Escolher MentoraLab/Odona no popup | Modo parceiro; erro #2655111 |
| Apagar conta do WhatsApp no celular | Perde histórico |

Se o app foi movido para Janaina Developer, **reverta primeiro** (seção 0).

---

## 0) Reverter app para Dona Rosa Pizzaria (se você moveu)

1. Portfólio **Janaina Guiotti - Developer** → Configurações → Contas → **Apps** → Dona Rosa Piuzza → **Remover**.
2. Portfólio **Dona Rosa Pizzaria** → Configurações → Contas → **Apps** → **Conectar ID do app** → `912159588512848`.
3. [Ajuda Meta — transferir app](https://www.facebook.com/business/help/236817717885919)

Pagamento do WhatsApp: **Gerenciador do WhatsApp** → conta Dona Rosa → **Pagamentos** (permanece aqui).

---

## 1) Token no portfólio Dona Rosa (servidor Supabase)

O token em `supabase/secrets.meta.env` deve ser do **mesmo portfólio** da conta WhatsApp (Dona Rosa), não de outro.

**Opção A — Usuário do sistema (recomendado, não expira rápido)**

1. [business.facebook.com](https://business.facebook.com) → portfólio **Dona Rosa Pizzaria**.
2. Configurações → **Usuários** → **Usuários do sistema** → criar ou abrir um usuário.
3. Adicionar ativos: app **Dona Rosa Piuzza** + conta WhatsApp **Dona Rosa Pizzaria**.
4. Gerar token com permissões: `whatsapp_business_management`, `whatsapp_business_messaging`.
5. Copiar token (`EAA…`) para `META_ACCESS_TOKEN` em `supabase/secrets.meta.env`.

**Opção B — Token temporário (teste rápido)**

1. [developers.facebook.com](https://developers.facebook.com) → Dona Rosa Piuzza → **WhatsApp** → **Configuração da API**.
2. Gerar **Temporary access token**.
3. Colar em `META_ACCESS_TOKEN` (válido por poucas horas).

Confirme no mesmo painel:

- **Phone number ID:** `115847421431608` → `META_PHONE_NUMBER_ID`
- **WABA ID:** `120100661027939` → `META_WABA_ID`

No projeto:

```bash
npm run secrets:meta
npm run meta:coexistence
npm run meta:verify
```

`meta:verify` deve mostrar `token_valid: true`. Status do número pode ainda ser `DISCONNECTED` até o passo 2.

---

## 2) Webhook (já no projeto)

No Developers → WhatsApp → **Configuração**:

- URL: `https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-webhook`
- Verify token: igual a `META_VERIFY_TOKEN`
- Campos: **messages**, **smb_message_echoes** (mensagens enviadas pelo celular)

`npm run meta:coexistence` inscreve o app na WABA com essa URL.

---

## 3) Ligar celular à API (coexistência) — passo principal

**Não use** “adicionar/verificar número” no Gerenciador do WhatsApp.

No **celular** (WhatsApp Business da pizzaria, +55 11 93061-7116):

1. **Configurações** → **Aparelhos conectados** → desconecte **WhatsApp Web**.
2. **Configurações** → **Conta** → **Plataforma comercial** (ou “Plataforma conectada”).
3. Toque **Conectar à Plataforma comercial** → o app pede **QR ou código**.
4. O **QR fica no monitor do computador** (fluxo Meta no site — seção 3b abaixo). A Rosa **escaneia** apontando o celular para a tela do PC.
5. **Alternativa:** mensagem da **Facebook Business** no WhatsApp com **código numérico** → no celular use “inserir código” em vez do QR.

### 3b) Onde pegar o QR (computador — você / Janaina)

O QR **não** está no Gerenciador do WhatsApp nem no Supabase. Ele aparece no **navegador**, no meio do **Embedded Signup** (como HubSpot/Wati):

1. No `.env` do build (só para esta sessão): `VITE_META_ALLOW_EMBEDDED_SIGNUP_POPUP=true`
2. `npm run build:hostgator` + upload, ou `npm run dev` em rede que a Rosa não precisa acessar.
3. Abrir `/admin/conectar-whatsapp` → **Gerar QR no computador** (botão).
4. Login Facebook com conta **admin de Dona Rosa Pizzaria** (ideal: **Rosa** no PC da pizzaria, não portfólio Janaina Developer).
5. No popup Meta: **Conectar app WhatsApp Business existente** → número **+55 11 93061-7116**.
6. Quando aparecer **“Compartilhar contatos e conversas”** com QR grande → Rosa escaneia no celular (tela que ela já abriu).

Se travar em “Selecionar portfólio” com Dona Rosa cinza: feche; adicione `VITE_META_BUSINESS_ID` (ID do portfólio em business.facebook.com/settings, URL `business_id=`) e refaça o build. **Não** avance com Janaina/MentoraLab.

Opcional no `.env`: `VITE_META_BUSINESS_ID=<id_portfolio_dona_rosa>` para preencher o portfólio no popup.

Confirme compartilhar histórico, se pedir.

### Cliente não acha “Plataforma comercial” (só vê “Dispositivos conectados”)

A tela **Dispositivos conectados** / **4 de 4 dispositivos** (Chrome no Windows) é **outro menu**. Aí só se desliga WhatsApp Web — **não** é onde conecta o painel.

| O que a Rosa vê | O que fazer |
|-----------------|-------------|
| Lista com **Google Chrome (Windows)** | Em **cada** linha → toque → **Desconectar** (liberar os 4 slots; ignore “Conectar dispositivo” por enquanto) |
| Botão **Conectar dispositivo** | É **WhatsApp Web** (QR no PC) — **não** use para o painel Dona Rosa |
| Depois de desconectar tudo | **Voltar** (seta) → **Configurações** → aba/menu **Conta** (não “Dispositivos”) |

Em **Conta**, procurar (o nome varia por versão do app):

- **Plataforma comercial**
- **Plataforma conectada** / **Plataformas conectadas**
- **Contas conectadas** (Meta)

Se **não existir** nenhum item assim em Conta:

1. Confirmar app **WhatsApp Business** (ícone com **B** ou nome “WhatsApp Business”), não o WhatsApp verde comum.
2. Atualizar o app na loja (Meta pede versão recente para coexistência).
3. Na lista de conversas, abrir chat da **Meta** / **Facebook Business** (conta oficial) e procurar botão **Conectar à plataforma comercial**.
4. Instalar **Meta Business Suite** no celular, entrar com a conta Facebook **admin de Dona Rosa Pizzaria**, e ver se aparece convite de conexão WhatsApp.
5. Aguardar até 24 h após `npm run meta:coexistence` no Mac; fechar e reabrir o WhatsApp Business.

**Não** usar “Assinar Meta Verified” só para liberar mais dispositivos — isso não conecta o painel.

---

## 4) Validar

```bash
npm run meta:verify
```

Esperado: `status=CONNECTED`, `platform_type=CLOUD_API`.

No site: `/admin/conectar-whatsapp` → **Atualizar status** → “Pronto”.

Teste: mensagem de outro celular para +55 11 93061-7116 → `/admin/conversas`.

---

## 5) Popup “Iniciar conexão” no site — **não use** (armadilha)

Se aparecer **“Selecione os ativos de negócios”** com **Dona Rosa Pizzaria cinza** e texto *“O app Dona Rosa Piuzza pertence a este portfólio”*:

| Ação | Resultado |
|------|-----------|
| Clicar **Avançar** com Janaina / MentoraLab / Odona | Portfólio errado, risco de pedir pagamento de novo, **não** é o QR de coexistência da pizzaria |
| Tentar forçar Dona Rosa no popup | Meta **não permite** (limitação documentada para app e negócio no mesmo portfólio) |

**Saída do loop de portfólio errado:** feche o popup se só aparecer Janaina/MentoraLab. O QR correto sai no **computador** (seção 3b), e a Rosa escaneia no celular (seção 3).

No admin do site o botão do popup foi **desligado** de propósito. Só desenvolvedores podem reabrir com `VITE_META_ALLOW_EMBEDDED_SIGNUP_POPUP=true` no build (não recomendado para a Rosa).

---

## Erros comuns

| Sintoma | Solução |
|---------|---------|
| 502 / token no admin | Token inválido após mover app → seção 1, `secrets:meta` |
| #2655122 no Gerenciador | Fechar SMS; usar seção 3 |
| #2655111 no popup | App em modo parceiro; use seção 3 ou App Review |
| Dona Rosa cinza no popup | Normal com app no mesmo portfólio; use seção 3 |

---

## Referências Meta

- [Coexistência — onboarding app Business](https://developers.facebook.com/docs/whatsapp/embedded-signup/custom-flows/onboarding-business-app-users/)
- [App Review — uso próprio](https://developers.facebook.com/docs/whatsapp/embedded-signup/app-review/)
