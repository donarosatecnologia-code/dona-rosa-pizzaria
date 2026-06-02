# /dr-fase1 — Infraestrutura Meta Cloud API + Conexão Supabase

> **Contexto:** A Meta Business já está configurada e o WhatsApp Business está ativo.
> A Fase 1 consiste em conectar a Meta Cloud API ao projeto Supabase, configurar os
> secrets, registrar o webhook e validar o canal de comunicação ponta a ponta.
> **Estimativa:** 6 horas / 2 dias úteis.

Execute cada agente na ordem abaixo. Não pule fases.

---

## AGENTE 1 — PM Agent

Produza o PRD da Fase 1 com foco em infraestrutura:

**Feature:** Conexão entre o projeto Dona Rosa Pizzaria (Supabase) e a Meta Cloud API oficial,
estabelecendo o canal de webhook bidirecional que servirá de base para todas as fases seguintes.

Produza:
1. **Feature Description** — o que será configurado e por quê é o alicerce de tudo
2. **Business Rules** — numeradas e testáveis:
   - Autenticidade de toda mensagem recebida via webhook deve ser validada por HMAC-SHA256 antes de qualquer ação
   - Nenhum secret Meta (APP_SECRET, ACCESS_TOKEN, PHONE_NUMBER_ID) pode estar exposto no bundle do cliente
   - O webhook deve responder à Meta em menos de 5 segundos
   - A Edge Function de verificação inicial deve responder corretamente ao `hub.challenge` da Meta
3. **Acceptance Scenarios** (Given/When/Then):
   - Happy path: Meta envia evento → webhook recebe → valida → persiste → retorna 200
   - Negativo: assinatura HMAC inválida → rejeita com 403, nada é persistido
   - Negativo: Edge Function fora do ar → Meta retenta, sem perda de dado
4. **Out of Scope** desta fase: interface de usuário, lógica de resposta automática, templates, disparos
5. **Open Questions:** listar qualquer dado que ainda precisa ser coletado da conta Meta da Janaina

Aguarde confirmação para continuar.

---

## AGENTE 2 — Arquiteto Supabase

Com o PRD aprovado, projete toda a infraestrutura de dados e funções necessária para esta fase:

### 2.1 Tabelas e Migrations

Crie as migrations em `supabase/migrations/` para:

**`whatsapp_config`** — configuração da conta Meta (uma linha por conta/número):
```
id, phone_number_id, display_name, status (active/inactive), webhook_verified_at, created_at
```

**`whatsapp_conversations`** — cada thread com um cliente:
```
id, wa_id (número E.164 do cliente), contact_name, status (open/closed/pending),
last_message_at, created_at
```

**`whatsapp_messages`** — cada mensagem individual:
```
id, conversation_id (FK), meta_message_id (UNIQUE — para deduplicação),
direction (inbound/outbound), message_type (text/image/audio/template/interactive),
content (jsonb — preservar payload completo da Meta), status (received/sent/delivered/read/failed),
created_at
```

**`whatsapp_webhook_events`** — log bruto de todos os eventos recebidos (auditoria):
```
id, event_type, raw_payload (jsonb), processed (bool), created_at
```

RLS obrigatório em todas as tabelas. Acesso apenas para `authenticated`.
Soft-delete obrigatório — sem DELETE físico em dados de conversa.

### 2.2 Edge Functions

**`whatsapp-webhook`** (`supabase/functions/whatsapp-webhook/index.ts`):
- GET: responder `hub.challenge` para verificação inicial da Meta
- POST: validar `X-Hub-Signature-256` → logar em `whatsapp_webhook_events` → retornar 200

**`whatsapp-verify`** (`supabase/functions/whatsapp-verify/index.ts`) — opcional, separado para clareza:
- Endpoint de health-check que confirma se a conexão Meta está ativa

### 2.3 Secrets necessários (Supabase)
```
META_APP_SECRET         — validação HMAC
META_ACCESS_TOKEN       — chamadas à Graph API
META_PHONE_NUMBER_ID    — ID do número WhatsApp Business
META_VERIFY_TOKEN       — token personalizado para verificação do webhook
META_API_VERSION        — ex: v20.0
```

### 2.4 Tipos TypeScript
Exporte os tipos de todas as tabelas em `src/integrations/supabase/types/whatsapp.ts`.

### 2.5 Execution Prompts numerados
Produza prompts auto-contidos para cada passo de implementação:
- Prompt 1: Migrations
- Prompt 2: Tipos TypeScript
- Prompt 3: Edge Function `whatsapp-webhook`
- Prompt 4: Configuração dos Secrets

Aguarde confirmação para continuar.

---

## AGENTE 3 — Dev Backend

Com a arquitetura aprovada, implemente:

### 3.1 Edge Function — `whatsapp-webhook`

```typescript
// supabase/functions/whatsapp-webhook/index.ts
// Responsabilidades:
// GET  → verificação inicial Meta (hub.challenge)
// POST → validar HMAC → logar evento bruto → retornar 200 imediatamente

// REGRAS OBRIGATÓRIAS:
// 1. Ler body como texto RAW (necessário para HMAC — não fazer parse antes)
// 2. Computar HMAC-SHA256 com META_APP_SECRET
// 3. Comparar com X-Hub-Signature-256 (timing-safe)
// 4. Se inválido: retornar 403 imediatamente, sem tocar no banco
// 5. Se válido: inserir em whatsapp_webhook_events com processed=false
// 6. Retornar { ok: true } com status 200
// 7. Todo processamento adicional é feito de forma assíncrona (não bloquear a resposta)
```

### 3.2 Tipos TypeScript

Implemente `src/integrations/supabase/types/whatsapp.ts` com interfaces para todas as tabelas definidas pelo Arquiteto.

### 3.3 Hook de status da conexão

Implemente `src/hooks/useWhatsappConnectionStatus.ts`:
- Verifica se `whatsapp_config` tem registro com `status = 'active'`
- Retorna `{ isConnected, config, isLoading, error }`
- Será usado pelo DevOps e pelo frontend de configuração

Aguarde confirmação para continuar.

---

## AGENTE 4 — DevOps

Configure toda a infraestrutura para conectar Meta ↔ Supabase:

### 4.1 Secrets Supabase
```bash
supabase secrets set META_APP_SECRET=VALOR
supabase secrets set META_ACCESS_TOKEN=VALOR
supabase secrets set META_PHONE_NUMBER_ID=VALOR
supabase secrets set META_VERIFY_TOKEN=VALOR_PERSONALIZADO
supabase secrets set META_API_VERSION=v20.0
```

### 4.2 Deploy da Edge Function
```bash
supabase functions deploy whatsapp-webhook --project-ref SEU_REF
```

URL que será registrada na Meta:
```
https://SEU_REF.supabase.co/functions/v1/whatsapp-webhook
```

### 4.3 Registro do Webhook na Meta

Passo a passo para Janaina executar no Meta Business Manager:
1. Acesse developers.facebook.com → App → WhatsApp → Configuration → Webhook
2. Callback URL: `[URL da Edge Function acima]`
3. Verify Token: `[valor de META_VERIFY_TOKEN]`
4. Clique "Verify and Save"
5. Após verificação, ative os campos: `messages`, `message_deliveries`, `message_reads`, `message_reactions`

### 4.4 Atualizar `.env.example`
Adicionar as novas variáveis (sem valores) para documentação.

### 4.5 Checklist de validação pós-configuração
```
[ ] Edge Function deployada e respondendo ao GET da Meta (hub.challenge)
[ ] Webhook verificado no Meta Business Manager (ícone verde)
[ ] Campos de webhook ativos: messages, message_deliveries, message_reads
[ ] Secrets configurados no Supabase Dashboard
[ ] .env.example atualizado
[ ] Enviar mensagem de teste pelo Meta Business Manager e verificar log em whatsapp_webhook_events
```

---

## AGENTE 5 — QA

Valide a fase 1 antes de avançar para a fase 2:

### Cenários obrigatórios:
```
Test: Verificação inicial do webhook Meta
  Given: Edge Function deployada com META_VERIFY_TOKEN configurado
  When:  Meta faz GET com hub.mode=subscribe e hub.verify_token correto
  Then:  Responde com hub.challenge, status 200

Test: Evento recebido com assinatura válida
  Given: Webhook registrado e ativo
  When:  Meta envia POST com X-Hub-Signature-256 válido
  Then:  Evento persistido em whatsapp_webhook_events, retorna 200 em < 5s

Test: Evento com assinatura inválida
  Given: Webhook ativo
  When:  POST recebido com assinatura HMAC incorreta
  Then:  Retorna 403, nada persistido no banco

Test: Evento duplicado (mesmo payload reenviado pela Meta)
  Given: Evento já persistido em whatsapp_webhook_events
  When:  Meta reenvia o mesmo evento
  Then:  Sem duplicata — idempotência garantida
```

### Security checklist:
- [ ] META_APP_SECRET não aparece em nenhum log ou response
- [ ] Nenhuma variável VITE_* contém segredos Meta
- [ ] RLS ativo em todas as tabelas novas
- [ ] Edge Function não processa nada antes de validar HMAC

**Ao finalizar:** "Fase 1 validada. Infraestrutura Meta Cloud API conectada ao Supabase. Pronta para iniciar Fase 2 — Gestão de Contatos."
