# Sair do loop Meta — Dona Rosa (ação única)

Se você já rodou `meta:verify` (11 ✓) e as permissões estão **Pronto para teste**, **pare de navegar** em Casos de uso / Personalizar / Permissões. Isso não destrava mais nada.

O bloqueio é **#2655111** (app em modo **parceiro** no Cadastro incorporado). A Meta não mostra “Solicitar acesso avançado” na sua UI porque **uso próprio** já tem acesso padrão — o popup errado é outro problema.

---

## O que continua funcionando

- **WhatsApp no celular da Rosa** → clientes atendidos normalmente.
- **Servidor** (webhook, token, número +55 11 93061-7116) → ok.

## O que não funciona

- **Painel** `/admin/conversas` → até `platform_type=CLOUD_API`.
- **Popup / QR no site** → #2655111 até a Meta liberar coexistência para este app.

---

## Faça só isto (ordem)

### 1) Rosa — celular (hoje)

1. WhatsApp Business → **Conta** → **Plataforma comercial**.
2. Se pedir QR → **cancele** (não escaneie popup do site).
3. Abra conversas → procure **Facebook Business** / **Meta** (conta oficial).
4. Se houver **Conectar** + **código** → use **inserir código** no app.
5. Se não houver mensagem em 48 h → passo 2.

### 2) Você — ticket Meta (30 min, uma vez)

1. https://developers.facebook.com/support/
2. Produto: **WhatsApp Business Platform**
3. Tópico: **WABiz: Onboarding** → **Embedded Signup - Coexistence Onboarding**
4. Cole:

```
App ID: 912159588512848 (Dona Rosa Piuzza)
Portfólio: Dona Rosa Pizzaria
Número: +55 11 93061-7116
Phone ID: 115847421431608
WABA: 120100661027939

Uso próprio (pizzaria), não BSP para terceiros.
meta:verify: 11 checks OK, status DISCONNECTED / ON_PREMISE.
Embedded Signup para no erro #2655111 (app parceiro / permissões avançadas).
Preciso coexistência: celular + Cloud API + webhook já configurado.
```

5. Anexe print do erro #2655111.

### 3) Terminal (semanal, 1 min)

```bash
npm run meta:verify
```

Quando aparecer `CONNECTED` + `CLOUD_API`, teste mensagem em `/admin/conversas`.

---

## Não faça mais

- Personalizar WhatsApp / Configurador parceiro / Entrar com Facebook no popup.
- App Review caçando botão que não existe na sua tela.
- Mover app de portfólio ou cadastrar pagamento em outro portfólio.
- `POST /register` com PIN (risco para coexistência).

---

## Quando o ticket responder

1. Siga a instrução da Meta (geralmente coexistência pelo celular ou novo `config_id`).
2. Atualize `.env` se derem novo Configuration ID.
3. `npm run build:hostgator` + upload.
4. `npm run meta:verify`.
