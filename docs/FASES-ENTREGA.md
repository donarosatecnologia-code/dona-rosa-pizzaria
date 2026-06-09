# Status de entrega — Fases 1 a 5

Checklist técnico do que foi combinado nos comandos `/dr-fase1` … `/dr-fase5` e o que ainda depende de fatores externos (Meta, operação).

Legenda: ✅ entregue · 🟡 parcial / bloqueado externamente · ⏳ pendente operacional

---

## Fase 1 — Infraestrutura Meta + Supabase

| Item | Status |
|---|---|
| Edge Function `whatsapp-webhook` (GET challenge + POST HMAC) | ✅ |
| Edge Function `whatsapp-verify` (health-check) | ✅ |
| Tabelas CRM base + `whatsapp_webhook_events` + dedupe | ✅ |
| Secrets Meta no Supabase | ✅ |
| RLS nas tabelas WhatsApp | ✅ |
| Hook `useWhatsappConnectionStatus` | ✅ |
| Scripts `meta:verify`, `homologacao:test-hmac` | ✅ |
| Webhook verificado no Meta Business Manager | 🟡 depende conta Meta |

---

## Fase 2 — Gestão de contatos

| Item | Status |
|---|---|
| `/admin/contatos` — lista, busca, paginação, mobile | ✅ |
| Importação CSV/Excel, normalização E.164 | ✅ |
| `whatsapp_import_batches` + histórico | ✅ |
| Opt-out | ✅ |
| Consentimento LGPD (site + CSV + WhatsApp) | ✅ |
| Etiquetas + segmentos (`/admin/etiquetas`, `/admin/segmentos`) | ✅ extra |
| Tag homologação QA | ✅ extra |

---

## Fase 3 — Templates + motor de disparo

| Item | Status |
|---|---|
| `/admin/templates` — CRUD, preview, submissão Meta | ✅ |
| Edge Function `whatsapp-templates` | ✅ |
| Edge Function `broadcast-send` (rate limit, dry-run) | ✅ |
| `/admin/disparos` — wizard, custo estimado, confirmação | ✅ |
| Exclusão automática opted-out | ✅ |
| Envio real para clientes | 🟡 `BROADCAST_DRY_RUN=true` + App Review Meta pendente |
| Submissão template à Meta em produção | 🟡 erro 2494160 sem permissão WABA completa |

---

## Fase 4 — Pesquisas + webhook + relatórios

| Item | Status |
|---|---|
| Webhook processa respostas interativas | ✅ |
| Pesquisas sequenciais multi-pergunta (`survey_flows`) | ✅ evolução além do escopo original |
| `/admin/pesquisas` — CRUD fluxos | ✅ extra |
| Campanha tipo pesquisa em disparos | ✅ |
| Relatório multi-coluna + export CSV | ✅ |
| Realtime no dashboard | ✅ via `useWhatsappBroadcastRealtime` |
| Gráfico donut + timeline | ✅ em `AdminDisparoDetail` |

---

## Fase 5 — Homologação e entrega

| Item | Status |
|---|---|
| Roteiro T01–T30 documentado | ✅ `docs/HOMOLOGACAO-T01-T30.md` |
| Regressão E2E automatizada | ✅ `npm run test:regression` |
| Guia de uso para Rosa | ✅ `docs/GUIA-ROSA-WHATSAPP.md` |
| README / guia desenvolvedor | ✅ `README.md` + `docs/DESENVOLVIMENTO.md` |
| Testes manuais com celulares reais (T01, T16, T19–T21) | ⏳ após Meta aprovar envio |
| Upload lista ~2.000 contatos da cliente | ⏳ operacional |
| Coexistência celular + PC | 🟡 `docs/COEXISTENCIA-ROSA-E-PC.md` — aguarda Meta |
| App Review Meta | 🟡 `docs/META-APP-REVIEW-PASSO-A-PASSO.md` |

---

## Bloqueios externos (não são débito de código)

1. **Meta App Review** — envio real e submissão de templates bloqueados até aprovação.
2. **`BROADCAST_DRY_RUN`** — manter `true` em homologação; `false` só após go-live Meta.
3. **Coexistência** — número no celular + API na nuvem depende de aprovação Meta.
4. **Leaked password protection** — toggle no Dashboard Supabase (plano Pro) — ver `docs/SEGURANCA-AUTH.md`.

---

## Próximos passos recomendados (pós-código)

1. Aplicar migration `20260609130000_register_site_consent_private_schema.sql` + deploy `register-site-consent`.
2. Concluir App Review Meta.
3. Rodar homologação manual T01–T25 com números QA.
4. `BROADCAST_DRY_RUN=false` + disparo piloto no segmento QA.
5. Importar base real da cliente com consentimento LGPD.
6. Habilitar proteção de senha vazada no Supabase (Pro).

---

## Conclusão

**Funcionalidades essenciais de software: concluídas.** O projeto está pronto para homologação final e go-live assim que a Meta liberar envios reais. Itens restantes são configuração Meta, testes com dispositivos reais e operação (importação da base).
