# Coexistência — Rosa (celular) + você (computador)

## Por que o passo antigo não funcionou

- **QR no celular** = escanear o **monitor do computador**, não um QR que “aparece sozinho”.
- **Chat da Meta** no WhatsApp **só aparece depois** que alguém inicia o cadastro no **computador** e informa o número. Se isso não aconteceu, **não existe** conversa Meta nem código para colar.
- Hoje o computador trava no erro **#2655111** antes de gerar QR/código — por isso o celular fica esperando à toa.

**Celular da Rosa:** continua atendendo clientes normalmente.

---

## O que fazer (único fluxo que funciona)

### Fase A — Destravar na Meta (você, uma vez)

Abra ticket: https://developers.facebook.com/support/

- **WABiz: Onboarding** → **Coexistence / Embedded Signup**
- Texto: app `912159588512848`, número `+55 11 93061-7116`, erro `#2655111`, uso próprio Dona Rosa, webhook ok.
- Anexe print do erro.

**Sem resposta da Meta (ou sem corrigir #2655111), o passo B não completa.**

---

### Fase B — Conexão em dupla (Rosa + você, no mesmo horário)

Quando a Meta liberar (ou se o popup passar do número sem #2655111):

**Rosa (celular da loja)**  
1. WhatsApp Business → **Conta** → **Plataforma comercial** → **Conectar**  
2. Escolha **Escanear QR code**  
3. **Deixe essa tela aberta** apontando para o computador  

**Você (computador)**  
1. Login Facebook = **conta admin da Dona Rosa** (Rosa ou quem administra o portfólio na Meta)  
2. Abra: `https://donarosapizzaria.com.br/admin/conectar-whatsapp`  
3. **Gerar QR no computador** (ou, na Meta, Configurador → **Entrar com o Facebook**)  
4. No popup: **Conectar app WhatsApp Business existente** → número `+55 11 93061-7116`  
5. Quando aparecer **QR grande na tela do PC** → Rosa escaneia  
6. **OU** se aparecer **código numérico** no PC → Rosa usa **Inserir código** no celular  

**Não cancele o QR no celular antes do QR aparecer no PC.**

---

### Fase C — Confirmar

```bash
npm run meta:verify
```

Esperado: `CONNECTED` + `CLOUD_API`. Teste mensagem em `/admin/conversas`.
