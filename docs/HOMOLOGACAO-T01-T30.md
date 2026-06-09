# Homologação T01–T30 — Dona Rosa WhatsApp

Checklist executável antes do go-live. Marque cada item ao testar.

**Pré-requisitos**

- [x] Migrations aplicadas (`npm run db:deploy`) — até 20260527180300
- [x] Edge Functions `whatsapp-webhook` + `broadcast-send` deployadas
- [x] Fila **Homologação QA** com ≥ 3 contatos de teste (tag `qa-homologacao` + consentimento LGPD)
- [x] `BROADCAST_DRY_RUN=true` para testes sem cobrança Meta (trocar para `false` só após App Review)

**Automação pós-deploy:** `npm run homologacao:post-deploy` (T03 + vitest + e2e smoke + regressão)

**Regressão completa (CMS intocado):** `docs/qa-sample/REGRESSAO-E2E-COMPLETO.md` · `npm run test:regression`

**Configurar contatos QA:**

1. Importar `docs/qa-sample/contatos-qa-homologacao.csv` (troque pelos números reais) com checkbox LGPD
2. Em **Contatos** → botão **Usar em homologação** em cada número, **ou** `scripts/sql/setup-qa-homologacao-contacts.sql`
3. Campanha: `scripts/sql/seed-homologacao-campaign.sql` → `npm run broadcast:send -- <campaign_id>`

---

## Bloco 1 — Infraestrutura (Fase 1)

| ID | Teste | Como verificar | OK |
|----|-------|----------------|-----|
| T01 | Mensagem teste Meta → webhook | Enviar pelo Business Manager; conferir `webhook_events` / logs | [ ] |
| T02 | Assinatura inválida → 403 | `npm run homologacao:test-hmac` → HTTP 403 | [x] |
| T03 | GET verificação webhook | `npm run meta:verify` → webhook GET ✓ | [x] |
| T04 | Logs Edge Functions | Supabase Dashboard → Functions → sem erros críticos | [ ] |

---

## Bloco 2 — Contatos (Fase 2)

| ID | Teste | Como verificar | OK |
|----|-------|----------------|-----|
| T05 | Importar 10 contatos | CSV teste; resumo 10 importados | [ ] |
| T06 | Reimportar → duplicados | Mesmo CSV; 10 duplicados | [ ] |
| T07 | Números inválidos | 2 inválidos + 8 válidos → 8 importados, 2 erros | [ ] |
| T08 | Sem coluna telefone | Erro `missing_phone_column` | [ ] |
| T09 | Opt-out | Marcar contato; badge opt-out | [ ] |
| T10 | Consentimento CSV | Importar **sem** checkbox → não entra na fila de disparo | [ ] |
| T10b | Consentimento CSV | Importar **com** checkbox → entra na fila | [x] |

---

## Bloco 3 — Templates (Fase 3)

| ID | Teste | Como verificar | OK |
|----|-------|----------------|-----|
| T11 | Criar rascunho | `/admin/templates` → salvar | [ ] |
| T12 | Preview WhatsApp | Visualização fiel no editor | [ ] |
| T13 | Submeter Meta | Só após App Review aprovado | [ ] bloqueado — erro Meta 2494160 (sem permissão WABA) |
| T14 | Template pendente em disparo | Bloqueado na lista de aprovados | [ ] |

---

## Bloco 4 — Disparo e pesquisa (Fase 3–4)

| ID | Teste | Como verificar | OK |
|----|-------|----------------|-----|
| T15 | Campanha rascunho → publicar | Status publicada | [x] |
| T16 | Modal custo + confirmação | R$ 0,35 × N antes de disparar | [ ] |
| T17 | Dry-run disparo | `BROADCAST_DRY_RUN=true` → recipients `sent` simulado | [x] |
| T18 | Opt-out excluído | Contato opted_out não em `resolve_queue_contact_ids` | [ ] |
| T19 | Resposta pesquisa | Botão/lista inbound → `broadcast_responses` | [ ] |
| T20 | Vínculo por context.message_id | Resposta ligada à campanha do template, não à última | [ ] |
| T21 | Dedupe 1 voto/contato/campanha | Segunda resposta ignorada (23505) | [ ] |
| T22 | Rate limit 50/s | Logs `broadcast_send` com intervalo ~20ms | [ ] |
| T23 | Retry 429 | Simular 429 Meta → backoff e retentativa | [ ] |

---

## Bloco 5 — Relatórios (Fase 4)

| ID | Teste | Como verificar | OK |
|----|-------|----------------|-----|
| T24 | Cards métricas | Enviadas, entregues, respostas, taxa | [ ] |
| T25 | Gráfico rosca | Distribuição de respostas | [ ] |
| T26 | Realtime | Nova resposta atualiza tela sem refresh | [ ] |
| T27 | Export CSV | Botão em relatório da campanha | [ ] |

---

## Bloco 6 — Coexistência e go-live (depende Meta)

| ID | Teste | Como verificar | OK |
|----|-------|----------------|-----|
| T28 | `meta:verify` CONNECTED + CLOUD_API | Script local | [ ] |
| T29 | Echo celular → `/admin/conversas` | Mensagem do app no celular aparece no painel | [ ] |
| T30 | Disparo real | `BROADCAST_DRY_RUN=false` + fila QA → entrega real | [ ] |

---

## Comandos úteis

```bash
npm run meta:verify
npm run homologacao:test-hmac          # T02
npm run test
npm run test:e2e:smoke
npm run broadcast:send -- <campaign_id>
npm run homologacao:simulate-response -- <campaign_id> "Sim"   # T19–T21
```

**Próximo bloco (agora):**

1. SQL Editor → `scripts/sql/seed-template-homologacao.sql` (T11)
2. Painel → `/admin/templates` — conferir preview (T12)
3. Painel → disparar de novo e validar modal de custo (T16)
4. `npm run homologacao:simulate-response -- 412799c7-b9d4-48d3-b683-3439aef3ca3f` (T19–T21)
5. Relatório → export CSV (T27)
6. `npm run build:hostgator` → upload produção (UI nova para Rosa)

## Bloqueios conhecidos (fora deste checklist)

- App Review Meta / erro #2655111
- Número `DISCONNECTED` / `ON_PREMISE` até coexistência concluída
