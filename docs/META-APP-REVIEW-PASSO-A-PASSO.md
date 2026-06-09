# App Review Meta — destravar #2655111 (Dona Rosa)

Resposta do suporte Meta: falta **whatsapp_business_messaging** com fluxo de **Solution Partner / acknowledgement** no Embedded Signup. Com app **Publicado**, permissões só aparecem no popup após **Acesso avançado** aprovado.

Webhook e token no projeto já estão ok (`meta:verify` 11/12).

---

## Passo 1 — App Review (obrigatório)

1. Abra: https://developers.facebook.com/apps/912159588512848/app-review/
2. Menu esquerdo do **app** (nível raiz): **Analisar** → **Análise do app** / **Pedidos**
3. **Criar pedido** ou **Continuar envio**
4. Adicione permissões:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Para **cada** permissão:
   - **Uso:** app interno Dona Rosa Pizzaria — backoffice `donarosapizzaria.com.br` sincroniza WhatsApp +55 11 93061-7116 com coexistência (celular + painel). Não é BSP para terceiros.
   - **Vídeo (2–3 min):** login no admin → `/admin/conectar-whatsapp` → explicar coexistência → mostrar `/admin/conversas`
6. **Enviar**

Prazo típico: alguns dias úteis.

---

## Passo 2 — Enquanto aguarda

- Rosa atende **só pelo celular** (normal).
- Não insistir em Plataforma comercial / QR sem o PC liberado.
- `npm run meta:verify` — só muda quando `CLOUD_API`.

---

## Passo 3 — Após aprovação

1. Copie novo **Configuration ID** se criar config em Cadastro incorporado.
2. `.env` → `VITE_META_EMBEDDED_SIGNUP_CONFIG_ID=...`
3. `npm run build:hostgator` + upload
4. **Sessão em dupla** (ver `docs/COEXISTENCIA-ROSA-E-PC.md`):
   - Rosa: Plataforma comercial → Escanear QR (câmera aberta)
   - PC: login Facebook **admin Dona Rosa** → `/admin/conectar-whatsapp` → Gerar QR → número +55 11 93061-7116
5. `npm run meta:verify` → `CONNECTED` + `CLOUD_API`

---

## IDs para o pedido

| Campo | Valor |
|-------|--------|
| Business Manager | 209788093001987 |
| WhatsApp Account (WABA) | 120100661027939 |
| Phone Number ID | 115847421431608 |
| App ID | 912159588512848 |
