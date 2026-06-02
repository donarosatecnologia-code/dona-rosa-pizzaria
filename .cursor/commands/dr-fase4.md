# /dr-fase4 — Pesquisa de Satisfação + Webhook de Respostas + Dashboard

> **Contexto:** Motor de disparo funcionando (Fase 3 concluída).
> A Fase 4 entrega a pesquisa com botões de resposta rápida nativos do WhatsApp,
> o webhook que computa os votos automaticamente, e o dashboard de relatórios.
> **Estimativa:** 9 horas / 3 dias úteis.

Execute cada agente na ordem abaixo.

---

## AGENTE 1 — PM Agent

Produza o PRD da Fase 4:

**Feature A — Pesquisa de Satisfação com Botões Nativos:**
Disparo de mensagem interativa com botões de resposta rápida nativos do WhatsApp (sem links externos, sem formulários, tudo dentro do app do cliente). Ex: `1. Excelente | 2. Regular | 3. Ruim`.

**Feature B — Webhook de Respostas:**
Quando o cliente toca em um botão, a Meta envia o evento para o webhook. O sistema computa o voto instantaneamente no banco de dados, sem intervenção manual.

**Feature C — Dashboard de Relatórios:**
Tela no backoffice mostrando por campanha: volume de envios, taxa de entrega, taxa de resposta e gráfico com distribuição dos resultados da pesquisa.

Business Rules:
```
BR-01: Cada cliente conta apenas um voto por campanha — respostas múltiplas do mesmo número são ignoradas após a primeira.
BR-02: O resultado da pesquisa deve ser computado em tempo real (< 5 segundos após o cliente responder).
BR-03: Mensagens interativas com botões são do tipo `interactive/button` na Meta API — diferente de templates de texto.
BR-04: O webhook já existente (Fase 1) deve ser estendido para processar eventos do tipo `interactive` sem criar nova Edge Function.
BR-05: O dashboard deve ser atualizado automaticamente (sem refresh manual) via Supabase Realtime.
BR-06: Relatórios ficam disponíveis permanentemente — não expiram.
BR-07: A propriedade pode exportar os resultados em CSV.
```

Acceptance Scenarios:
- Happy path: cliente recebe mensagem → toca "Excelente" → voto computado em < 5s → dashboard atualiza em tempo real
- Negativo: mesmo cliente responde duas vezes → segundo voto ignorado
- Negativo: cliente responde fora do contexto de qualquer pesquisa ativa → evento logado, sem erro
- Edge: webhook recebe resposta com `button_reply` mas campaign_id não encontrado → log de erro, sem crash

Aguarde confirmação.

---

## AGENTE 2 — UX Writer Agent

### Templates de pesquisa de satisfação (formato Meta `interactive/button`):

**Template: `pesquisa_satisfacao`** (UTILITY):
```
Como foi sua experiência com a Dona Rosa hoje? 🍕
Sua opinião nos ajuda a fazer pizzas ainda melhores!

[Botão 1] 😄 Excelente
[Botão 2] 😐 Regular
[Botão 3] 😞 Ruim
```

**Template: `pesquisa_pos_entrega`** (UTILITY):
```
Olá, {{1}}! Sua pizza chegou bem?
Conta pra gente como foi:

[Botão 1] 👍 Chegou perfeita
[Botão 2] 🕐 Demorou demais
[Botão 3] 📦 Chegou fria
```

### Microcopy do dashboard:

| Elemento | Copy |
|---|---|
| Título da página | "Relatórios de Campanhas" |
| Seção de resultados | "Resultados da Pesquisa" |
| Métrica: envios | "Mensagens enviadas" |
| Métrica: entregues | "Entregues" |
| Métrica: respostas | "Responderam" |
| Taxa de resposta | "Taxa de resposta: {N}%" |
| Exportar | "Exportar resultados (.csv)" |
| Sem respostas ainda | "Aguardando respostas dos clientes..." |
| Atualizado agora | "Atualizado agora mesmo" |

---

## AGENTE 3 — UX Agent

### Tela `/admin/campanhas/[id]` — Relatório da campanha:

**Seção 1 — Métricas principais (cards):**
| Card | Dado | Visual |
|---|---|---|
| Enviadas | N mensagens | número grande |
| Entregues | N (%) | número + badge verde |
| Responderam | N (%) | número + badge azul |
| Taxa de resposta | % | número grande destacado |

**Seção 2 — Gráfico de resultados da pesquisa:**
- Gráfico de rosca (donut) com os votos por opção
- Legenda com rótulo + quantidade + percentual
- Atualização em tempo real via Realtime (animação suave ao receber novo voto)

**Seção 3 — Timeline de envios:**
- Gráfico de linha: envios ao longo do tempo durante o disparo

**Seção 4 — Tabela de respostas:**
- Número (mascarado: `+55119****8888`), resposta, horário
- Paginada, 50 por página
- Botão "Exportar CSV"

### Estados:
| Estado | O que Rosa vê |
|---|---|
| Campanha em envio | Progress bar + contadores ao vivo |
| Aguardando respostas | Métricas de envio finalizadas + "Aguardando respostas..." |
| Com respostas | Dashboard completo com gráfico |
| Sem nenhuma resposta | Gráfico vazio + "Nenhuma resposta ainda." |

### Componentes:
- `recharts` (já listado como disponível) — DonutChart + LineChart
- `Card` — métricas
- `Table` — respostas individuais
- Supabase Realtime — atualização automática sem refresh

Aguarde confirmação.

---

## AGENTE 4 — Arquiteto Supabase

### 4.1 Migrations adicionais

**`whatsapp_survey_responses`** — votos da pesquisa:
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id     uuid NOT NULL REFERENCES whatsapp_campaigns(id)
contact_id      uuid REFERENCES whatsapp_contacts(id)
phone_number    text NOT NULL               -- fallback se contato não encontrado
button_id       text NOT NULL               -- ex: "btn_excelente"
button_title    text NOT NULL               -- ex: "Excelente"
meta_message_id text                        -- mensagem original de resposta
responded_at    timestamptz DEFAULT now()
UNIQUE (campaign_id, phone_number)          -- garante um voto por contato por campanha
```

**Adicionar à `whatsapp_campaigns`:**
```sql
type            text NOT NULL DEFAULT 'marketing' -- marketing | survey
survey_options  jsonb   -- [{ id: "btn_1", title: "Excelente" }, ...]
responses_count int NOT NULL DEFAULT 0
```

### 4.2 Extensão da Edge Function `whatsapp-webhook`

Estender o processador de eventos para identificar e rotear:
```
event.entry[].changes[].value.messages[].type === "interactive"
  → subtype: "button_reply"
  → extrair: button_id, button_title, from (phone), context.id (message_id original)
  → identificar campaign pelo context.id (cruzar com campaign_messages)
  → inserir em whatsapp_survey_responses (ON CONFLICT DO NOTHING — deduplicação)
  → incrementar responses_count na campanha
```

### 4.3 Realtime

Habilitar Realtime em:
- `whatsapp_survey_responses` — para atualização ao vivo do gráfico
- `whatsapp_campaigns` — para atualização das métricas (responses_count, delivered, read)

### 4.4 View para dashboard (opcional, para simplificar queries):
```sql
CREATE VIEW whatsapp_campaign_stats AS
SELECT
  c.id,
  c.name,
  c.status,
  c.total_contacts,
  c.sent,
  c.delivered,
  c.read,
  c.failed,
  c.responses_count,
  ROUND(c.responses_count::numeric / NULLIF(c.delivered, 0) * 100, 1) as response_rate
FROM whatsapp_campaigns c;
```

Aguarde confirmação.

---

## AGENTE 5 — Dev Backend

### 5.1 Extensão do `whatsapp-webhook` para processar `interactive/button_reply`

```typescript
// Adicionar ao processador de eventos existente:
// 1. Detectar messages[].type === "interactive"
// 2. Extrair button_reply: { id, title } e from e context.message_id
// 3. Buscar campaign_id via whatsapp_campaign_messages.meta_message_id = context.message_id
// 4. INSERT INTO whatsapp_survey_responses ... ON CONFLICT (campaign_id, phone_number) DO NOTHING
// 5. UPDATE whatsapp_campaigns SET responses_count = responses_count + 1
//    (apenas se o INSERT acima de fato inseriu — verificar rows affected)
```

### 5.2 Função de exportação CSV

```typescript
// src/lib/whatsapp/exportSurveyResults.ts
// Recebe: campaign_id
// Retorna: Blob CSV com colunas: telefone_mascarado, resposta, horário
// Usar no frontend via URL.createObjectURL para download direto
```

### 5.3 Hooks:
```typescript
useCampaignStats(id)           — métricas da campanha (polling ou Realtime)
useSurveyResponses(campaignId) — lista de respostas paginada
useSurveyDistribution(id)      — contagem por opção para o gráfico
useExportSurveyCSV(id)         — mutation que gera e baixa o CSV
useRealtimeCampaignUpdates(id) — Supabase Realtime subscription
```

---

## AGENTE 6 — Dev Frontend

### Arquivos:
```
src/pages/admin/campanhas/
  [id]/
    index.tsx              ← relatório completo da campanha

src/components/admin/campanhas/
  CampaignStats.tsx        ← cards de métricas
  SurveyDonutChart.tsx     ← gráfico de rosca com recharts
  CampaignTimeline.tsx     ← linha do tempo de envios
  SurveyResponsesTable.tsx ← tabela de respostas com máscara de telefone
  ExportCSVButton.tsx      ← botão de exportação

src/hooks/
  useCampaignStats.ts
  useSurveyDistribution.ts
  useSurveyResponses.ts
  useRealtimeCampaignUpdates.ts
  useExportSurveyCSV.ts
```

### Realtime no dashboard:
```typescript
// Ao montar o componente de relatório:
// 1. Subscrever a whatsapp_survey_responses INSERT
// 2. Ao receber novo evento: invalidar queries ou atualizar cache diretamente
// 3. Animar o gráfico suavemente (recharts suporta animação nativa)
// 4. Limpar subscription no unmount (obrigatório)
```

### Máscara de telefone:
```typescript
// +5511999998888 → +55119****8888
// Nunca exibir número completo no dashboard
```

---

## AGENTE 7 — QA

### Cenários obrigatórios:
```
Test: Cliente responde pesquisa → voto computado
  Given: campanha de pesquisa enviada, cliente recebeu mensagem
  When:  cliente toca "Excelente" no WhatsApp
  Then:  voto em whatsapp_survey_responses em < 5s, dashboard atualiza

Test: Cliente responde duas vezes
  Given: cliente já respondeu "Excelente"
  When:  mesmo cliente responde novamente "Ruim"
  Then:  segundo voto ignorado (ON CONFLICT DO NOTHING), contagem não altera

Test: Dashboard atualiza sem refresh
  Given: Rosa está com o dashboard aberto
  When:  novo voto chega via webhook
  Then:  gráfico e métricas atualizam automaticamente em < 3s

Test: Exportação CSV
  Given: campanha com 200 respostas
  When:  Rosa clica "Exportar resultados"
  Then:  download de CSV com 200 linhas (telefone mascarado, resposta, horário)

Test: Resposta sem campanha correspondente
  Given: webhook recebe button_reply com context.message_id desconhecido
  Then:  evento logado em whatsapp_webhook_events, sem crash, sem dado corrompido
```

### Checklist de segurança:
- [ ] Telefones mascarados no dashboard — número completo não aparece na UI
- [ ] Realtime não vaza dados de outras campanhas
- [ ] Export CSV só acessível para admin autenticado
- [ ] UNIQUE constraint em (campaign_id, phone_number) impede votos duplicados no banco

**Ao finalizar:** "Fase 4 validada. Pesquisa + Webhook + Dashboard funcionando. Pronta para Fase 5 — Testes em ambiente controlado e homologação final."
