# Erro Meta #2655111 — popup trava no número

## O que significa

> O app do parceiro não tem as permissões avançadas de mensagens e Gerenciamento do WhatsApp Business…

O fluxo **Embedded Signup** está tratando o app **Dona Rosa Piuzza** como **parceiro** (Tech Provider / Solution Partner). Para a pizzaria usar **o próprio** número, isso é o caminho errado — e o botão **Avançar** fica desabilitado.

**Importante:** o WhatsApp no **celular da Rosa continua funcionando** para falar com clientes. O que não funciona é o **painel** (`/admin/conversas`) receber mensagens via API até `platform_type=CLOUD_API`.

---

## Pare agora (evita piorar)

1. **Feche** o popup da Meta (não insista em Avançar).
2. **Não** mova app de portfólio nem cadastre pagamento em Janaina Developer.
3. **Não** rode `register` com PIN sem orientação — pode conflitar com coexistência.

---

## Caminho A — Uso próprio (recomendado, sem App Review de parceiro)

A Meta diz: quem só acessa **os próprios** dados **não** precisa de Advanced Access — precisa de **token de Usuário do sistema** (já feito) + configuração correta, **sem** fluxo de parceiro.

### A1) Nova configuração do Facebook Login for Business

Você já abriu **Casos de uso → Conectar-se com clientes pelo WhatsApp**. A partir daí:

| Onde você está | É o Caminho 1? |
|----------------|----------------|
| **Etapa 1 / 2 / 3** (Configuração básica) | **Não** — webhook e número (já feitos no projeto) |
| **Torne-se um parceiro** | **Não** — isso reforça erro #2655111 |
| **Outras ferramentas → Ferramentas** ou link abaixo | **Sim** — cadastro incorporado |

**Cliques:**

1. Menu esquerdo (dentro do WhatsApp) → **Outras ferramentas** → **Ferramentas** (ou **Recursos**)
2. Procure **Cadastro incorporado** / **Embedded Signup** / **Configurador de cadastro incorporado**
3. Se não aparecer, abra direto: [Cadastro incorporado WhatsApp](https://developers.facebook.com/apps/912159588512848/whatsapp-business/wa-embedded-signup/)
4. **Criar configuração** → modelo **WhatsApp Embedded Signup** (não Tech Provider / Solution Partner)
4. Permissões só: `whatsapp_business_management`, `whatsapp_business_messaging`
5. Ativar **Coexistência** / `whatsapp_business_app_onboarding` na configuração
6. Copiar o novo **Configuration ID** → `.env`:

   ```env
   VITE_META_EMBEDDED_SIGNUP_CONFIG_ID=<novo_id>
   ```

7. `npm run build:hostgator` + upload do `dist/`

### A2) Confirmar que o app não é “Tech Provider”

1. [business.facebook.com](https://business.facebook.com) → portfólio **Dona Rosa Pizzaria**
2. Se existir inscrição como **Provedor de tecnologia** / parceiro WhatsApp para **revender** a terceiros — isso força modo parceiro. Para uso só da pizzaria, o app deve ser **desenvolvedor direto** (Cloud API Get Started), não Solution Partner.

### A3) Celular (sem depender do popup quebrado)

Com servidor ok (`npm run meta:verify` → 11 ✓, 1 falha de status):

1. Rosa: **Conta → Plataforma comercial → Conectar**
2. Se pedir QR e o popup no PC falhar com #2655111, use o **código numérico** se a Meta enviar no chat **Facebook Business** no WhatsApp
3. `npm run meta:verify` até `CONNECTED` + `CLOUD_API`

---

## Caminho B — App Review (se a Meta só liberar como parceiro)

1. [App Review](https://developers.facebook.com/apps/912159588512848/app-review/) → **Permissões e recursos**
2. Pedir **Acesso avançado** (Advanced):
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
3. **Justificativa (PT):** “App interno da Dona Rosa Pizzaria para o backoffice em donarosapizzaria.com.br sincronizar mensagens do número +55 11 93061-7116 com coexistência (celular + painel). Não é BSP para terceiros.”
4. **Vídeo:** gravar tela do `/admin/conversas` e fluxo de conexão (2–3 min)
5. Prazo típico: alguns dias úteis

Enquanto aguarda: operação normal no **celular**.

---

## Caminho C — Suporte Meta (urgente)

1. [Suporte para desenvolvedores](https://developers.facebook.com/support/)
2. Tópico: **WABiz: Onboarding** → **Embedded Signup - Coexistence Onboarding**
3. Anexar: erro `#2655111`, app `912159588512848`, número `+55 11 93061-7116`, portfólio Dona Rosa Pizzaria, uso **próprio** (não parceiro)

---

## Como saber que resolveu

```bash
npm run meta:verify
```

Esperado na seção Coexistência:

- `status=CONNECTED`
- `platform_type=CLOUD_API`

Teste: mensagem de outro celular → aparece em `/admin/conversas`.
