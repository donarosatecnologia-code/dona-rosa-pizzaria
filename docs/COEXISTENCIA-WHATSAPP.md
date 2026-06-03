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
3. Se aparecer **Dona Rosa Piuzza** / Meta / “Conectar” → toque e siga (QR ou confirmação).
4. Se **não** aparecer nada em Plataforma comercial, aguarde até 15 min após `meta:coexistence` e abra a conversa da **Meta / Facebook Business** no WhatsApp.

Confirme compartilhar histórico, se pedir.

---

## 4) Validar

```bash
npm run meta:verify
```

Esperado: `status=CONNECTED`, `platform_type=CLOUD_API`.

No site: `/admin/conectar-whatsapp` → **Atualizar status** → “Pronto”.

Teste: mensagem de outro celular para +55 11 93061-7116 → `/admin/conversas`.

---

## 5) Botão “Iniciar conexão” no site (opcional)

Use **só** se o passo 3 não trouxer convite no celular.

Limitação da Meta: com o app no **mesmo** portfólio Dona Rosa, o popup pode mostrar **Dona Rosa cinza**. Nesse caso o caminho oficial é **seção 3 (celular)**, não o popup.

Se usar o popup: conta admin do app, portfólio **Dona Rosa** (se liberado) ou suporte Meta — **sem** mudar portfólio do app.

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
