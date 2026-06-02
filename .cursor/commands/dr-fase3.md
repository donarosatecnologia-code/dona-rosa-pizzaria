# /dr-fase3 — Templates Meta + Motor de Disparo em Lote

> **Contexto:** Contatos importados e infraestrutura Meta ativa (Fases 1 e 2 concluídas).
> A Fase 3 entrega a interface de criação e submissão de templates para aprovação da Meta,
> e o motor de disparo em lote com controle de vazão para proteger o número.
> **Estimativa:** 9 horas / 3 dias úteis.

Execute cada agente na ordem abaixo.

---

## AGENTE 1 — PM Agent

Produza o PRD da Fase 3:

**Feature A — Gestão de Templates:**
Interface no backoffice para criar, visualizar e submeter templates de mensagem para aprovação da Meta. Templates são pré-requisito obrigatório da Meta para mensagens fora da janela de 24h.

**Feature B — Motor de Disparo em Lote:**
Capacidade de selecionar uma lista de contatos, escolher um template aprovado e executar o disparo com controle de vazão (rate limiting) para proteger o número de WhatsApp Business.

Business Rules obrigatórias:
```
BR-01: Apenas templates com status `approved` pela Meta podem ser usados em disparos.
BR-02: O disparo deve respeitar o rate limit do tier atual da conta Meta (inicialmente Tier 1: 1.000 conversas únicas/dia).
BR-03: Cada disparo gera um registro de campanha com status rastreável (draft → scheduled → sending → completed → failed).
BR-04: O sistema deve enviar no máximo 50 mensagens por segundo para evitar bloqueio da Meta.
BR-05: Contatos com status `opted_out` são automaticamente excluídos de qualquer disparo, sem exceção.
BR-06: Um disparo iniciado não pode ser cancelado parcialmente — apenas pausado se ainda não começou.
BR-07: O custo estimado (R$ 0,35 × número de contatos) deve ser exibido antes de confirmar o disparo.
BR-08: Todo disparo é rastreado por contato: enviado, entregue, lido, falhou.
```

Acceptance Scenarios:
- Happy path: template aprovado selecionado + 500 contatos + confirmação → disparo executado com rate limit → relatório parcial em tempo real
- Negativo: tentar disparar com template pendente de aprovação → bloqueado com mensagem explicativa
- Negativo: todos os contatos selecionados são opt-out → erro antes de iniciar
- Edge: Meta retorna erro 429 (rate limit) → sistema pausa, aguarda, retenta automaticamente

Aguarde confirmação.

---

## AGENTE 2 — UX Writer Agent

Produza o microcopy para templates e motor de disparo:

### Templates:
| Elemento | Copy |
|---|---|
| Título da página | "Templates de Mensagem" |
| Subtítulo | "Crie e gerencie os modelos de mensagem para suas campanhas. Todos precisam de aprovação da Meta antes do uso." |
| Botão criar | "Novo Template" |
| Status: pending | "Aguardando aprovação" |
| Status: approved | "Aprovado" |
| Status: rejected | "Reprovado pela Meta" |
| Tooltip rejected | "A Meta não aprovou este modelo. Revise o conteúdo e tente novamente." |
| Empty state | "Nenhum template ainda. Crie o primeiro modelo para começar a disparar campanhas." |
| Aviso variáveis | "Use {{1}}, {{2}} para personalizar a mensagem com o nome ou outros dados do cliente." |

### Disparo:
| Elemento | Copy |
|---|---|
| Título | "Nova Campanha" |
| Custo estimado | "Custo estimado: R$ {valor} ({N} contatos × R$ 0,35)" |
| Aviso custo | "Este valor será cobrado diretamente pela Meta no cartão cadastrado na sua conta Business." |
| Botão confirmar | "Confirmar Disparo" |
| Confirmação modal | "Você está prestes a enviar {N} mensagens. Isso não pode ser desfeito. Confirmar?" |
| Enviando | "Enviando... {N} de {total} mensagens" |
| Concluído | "Campanha enviada! {N} mensagens entregues." |
| Opt-outs removidos | "{N} contatos foram removidos automaticamente por terem optado por não receber mensagens." |

---

## AGENTE 3 — UX Agent

Projete as interfaces de templates e criação de campanha:

### Tela `/admin/templates`:
- Lista de templates (nome, status Meta, categoria, data de criação)
- Botão "Novo Template"
- Modal/página de criação com preview ao vivo da mensagem no WhatsApp

### Tela `/admin/campanhas/nova`:
- Step 1: Selecionar template aprovado
- Step 2: Selecionar contatos (todos / filtro por status / upload de subgrupo)
- Step 3: Resumo + custo estimado + confirmação
- Tela de progresso em tempo real durante o disparo

### Estados por componente:

**Criação de template:**
| Campo | Comportamento |
|---|---|
| Nome do template | snake_case automático, sem espaços |
| Categoria | Select: UTILITY / MARKETING |
| Corpo da mensagem | Textarea com contador de caracteres (máx 1024) |
| Variáveis | Detectar {{N}} automaticamente e mostrar campos de exemplo |
| Preview | Bolha de WhatsApp ao vivo com os valores de exemplo |
| Botão submeter | "Enviar para aprovação da Meta" |

**Progresso do disparo:**
- Barra de progresso com percentual
- Contador em tempo real: enviadas / total
- Lista de falhas (se houver) com número e motivo
- Botão "Ver relatório completo" ao finalizar

### Componentes shadcn/ui:
- `Steps` ou `Stepper` (criar se não existir) — fluxo de 3 etapas da campanha
- `Textarea` com contador — corpo do template
- `Select` — categoria e seleção de template
- `AlertDialog` — confirmação de disparo (irreversível)
- `Progress` — andamento do envio
- `Card` — preview da mensagem

Aguarde confirmação.

---

## AGENTE 4 — Arquiteto Supabase

### Migration: `whatsapp_templates` + `whatsapp_campaigns` + `whatsapp_campaign_messages`

**`whatsapp_templates`:**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL UNIQUE        -- snake_case, ex: pesquisa_satisfacao
display_name    text                        -- nome legível para a interface
category        text NOT NULL              -- UTILITY | MARKETING | AUTHENTICATION
language        text NOT NULL DEFAULT 'pt_BR'
body            text NOT NULL              -- texto com variáveis {{1}} {{2}}
variables       jsonb                      -- [{ index: 1, example: "Maria" }]
meta_template_id text                      -- ID retornado pela Meta após submissão
status          text NOT NULL DEFAULT 'draft' -- draft | pending | approved | rejected
rejection_reason text
submitted_at    timestamptz
approved_at     timestamptz
created_at      timestamptz DEFAULT now()
```

**`whatsapp_campaigns`:**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
template_id     uuid NOT NULL REFERENCES whatsapp_templates(id)
status          text NOT NULL DEFAULT 'draft' -- draft | scheduled | sending | completed | failed | paused
total_contacts  int NOT NULL DEFAULT 0
sent            int NOT NULL DEFAULT 0
delivered       int NOT NULL DEFAULT 0
read            int NOT NULL DEFAULT 0
failed          int NOT NULL DEFAULT 0
started_at      timestamptz
completed_at    timestamptz
created_at      timestamptz DEFAULT now()
```

**`whatsapp_campaign_messages`** — rastreio por contato:
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id     uuid NOT NULL REFERENCES whatsapp_campaigns(id)
contact_id      uuid NOT NULL REFERENCES whatsapp_contacts(id)
meta_message_id text UNIQUE               -- retornado pela Meta no envio
status          text NOT NULL DEFAULT 'pending' -- pending | sent | delivered | read | failed
error_code      text
error_message   text
sent_at         timestamptz
delivered_at    timestamptz
read_at         timestamptz
```

### Edge Functions

**`submit-template`** — submete template para aprovação da Meta:
```
POST /functions/v1/submit-template
Auth: JWT Supabase (authenticated)
Body: { template_id: uuid }
Ação: chama Graph API → salva meta_template_id → atualiza status para pending
```

**`send-campaign`** — motor de disparo com rate limiting:
```
POST /functions/v1/send-campaign
Auth: JWT Supabase (authenticated)
Body: { campaign_id: uuid }
Ação:
  1. Buscar campanha + contatos (excluindo opted_out)
  2. Atualizar campanha para status=sending
  3. Processar em batches de 50/s (usar setTimeout ou loops controlados)
  4. Para cada contato: chamar Graph API → registrar resultado em campaign_messages
  5. Atualizar contadores da campanha em tempo real
  6. Finalizar com status=completed ou failed
```

Aguarde confirmação.

---

## AGENTE 5 — Dev Backend

Implemente:

### 5.1 Edge Function `submit-template`
- Validar JWT antes de qualquer operação
- Chamar `POST https://graph.facebook.com/{version}/{waba_id}/message_templates`
- Mapear resposta da Meta → atualizar `whatsapp_templates`
- Retornar status e ID do template

### 5.2 Edge Function `send-campaign`
```typescript
// Rate limiting: máximo 50 mensagens por segundo
// Para cada mensagem:
//   POST https://graph.facebook.com/{version}/{phone_number_id}/messages
//   Body: { messaging_product: "whatsapp", to: phone_e164, type: "template", template: { name, language, components } }
// Capturar meta_message_id da resposta
// Atualizar campaign_messages com status e timestamps
// Atualizar contadores na campaign em tempo real (para o frontend polling)
```

### 5.3 Hooks:
```typescript
useWhatsappTemplates()        — lista todos os templates
useCreateTemplate()           — mutation: criar rascunho
useSubmitTemplate()           — mutation: submeter para Meta
useCampaigns()                — lista campanhas
useCreateCampaign()           — mutation: criar campanha
useSendCampaign()             — mutation: disparar campanha
useCampaignProgress(id)       — polling do progresso (a cada 2s durante envio)
```

---

## AGENTE 6 — Dev Frontend

Implemente:

```
src/pages/admin/
  templates/
    index.tsx                 ← lista de templates
    novo/index.tsx            ← criação + preview ao vivo
  campanhas/
    index.tsx                 ← lista de campanhas
    nova/index.tsx            ← wizard 3 etapas
    [id]/index.tsx            ← detalhe / progresso em tempo real

src/components/admin/
  templates/
    TemplatesList.tsx
    TemplateStatusBadge.tsx
    TemplateEditor.tsx         ← textarea + contador + preview ao vivo
    WhatsappMessagePreview.tsx ← bolha visual de WhatsApp
  campanhas/
    CampaignWizard.tsx         ← stepper 3 etapas
    CampaignProgress.tsx       ← barra de progresso + contadores
    CostEstimate.tsx           ← cálculo e aviso de custo Meta
```

### Regra crítica — `WhatsappMessagePreview`:
Renderize uma bolha visual fiel ao WhatsApp (fundo verde-escuro, bolha branca, fonte e tamanho corretos) para que Rosa veja exatamente como a mensagem chegará para o cliente.

---

## AGENTE 7 — QA

### Cenários obrigatórios:
```
Test: Submissão de template para Meta
  Given: template criado com corpo válido
  When:  Rosa clica "Enviar para aprovação"
  Then:  status muda para "Aguardando aprovação", meta_template_id salvo

Test: Tentativa de disparo com template pendente
  Given: template com status pending
  When:  Rosa tenta criar campanha com este template
  Then:  template não aparece na lista de seleção (apenas approved aparecem)

Test: Disparo com contatos opt-out
  Given: lista de 100 contatos, 10 com opted_out
  When:  campanha iniciada para os 100
  Then:  10 automaticamente excluídos, 90 enviados, resumo correto

Test: Rate limit Meta (429)
  Given: disparo em andamento
  When:  Meta retorna erro 429
  Then:  sistema pausa, aguarda, retenta sem perder o progresso

Test: Custo estimado exibido antes de confirmar
  Given: 500 contatos selecionados
  When:  Rosa chega na etapa 3 do wizard
  Then:  exibido "Custo estimado: R$ 175,00 (500 contatos × R$ 0,35)"
```

**Ao finalizar:** "Fase 3 validada. Templates e motor de disparo funcionando. Pronta para Fase 4 — Webhook de Respostas + Dashboard."
