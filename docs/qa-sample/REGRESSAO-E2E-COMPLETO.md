# Regressão e E2E completo — WhatsApp + site (CMS intocado)

Checklist para validar **toda a stack WhatsApp/CRM** e **smoke do site público**, sem alterar textos, imagens, cardápio ou páginas já validadas.

---

## Zona de exclusão (não testar com escrita)

| Área | Rotas | Permitido | Proibido |
|------|-------|-----------|----------|
| Páginas CMS | `/admin/pages`, `/admin/mirror/*`, `/admin/preview/*` | Abrir e fechar | Salvar, publicar, editar textos/imagens |
| Cardápio admin | `/admin/cardapio` | Smoke de carregamento | Criar/editar produto, preço, imagem |
| Topo/rodapé | `/admin/header-footer` | Smoke de carregamento | Salvar alterações |
| Site público | `/`, `/cardapio`, etc. | Navegar e conferir render | Formulários que gravem conteúdo editorial |

Dados de teste WhatsApp devem usar prefixo **`[QA]`** em etiquetas/segmentos/pesquisas criados manualmente e podem ser removidos depois.

---

## Execução automatizada

```bash
# Pacote completo (recomendado)
npm run test:regression

# Ou por partes
npm run test                              # vitest (inclui survey-flow-utils)
npm run test:e2e:smoke                    # login + guard
npm run test:e2e:regression               # público readonly + admin readonly
bash scripts/regression-api-whatsapp.sh   # API WhatsApp (requer .env)
npm run meta:verify                       # infra Meta
npm run homologacao:test-hmac             # webhook 403
```

Credenciais opcionais no `.env` (não commitar):

```env
E2E_ADMIN_EMAIL=seu@email.com
E2E_ADMIN_PASSWORD=***
```

Sem credenciais, os testes e2e de admin autenticado são **pulados** automaticamente; o restante roda normalmente.

---

## Matriz de cobertura

| ID | Área | Tipo | Automatizado | OK |
|----|------|------|--------------|-----|
| **A — Site público (readonly)** |
| A01 | Home carrega header/footer | e2e | `public-readonly.spec.ts` | [ ] |
| A02 | Cardápio público exibe itens/preços | e2e | idem | [ ] |
| A03 | Quem somos / contato sem erro 500 | e2e | idem | [ ] |
| A04 | `/login` com `noindex` | e2e | idem | [ ] |
| **B — Auth e guards** |
| B01 | `/admin/disparos` → login sem sessão | e2e smoke | `admin-smoke.spec.ts` | [ ] |
| B02 | Login admin válido | e2e | `whatsapp-admin-readonly` (se .env) | [ ] |
| B03 | Webhook HMAC inválido → 403 | script | `homologacao:test-hmac` | [ ] |
| **C — API / banco WhatsApp (readonly)** |
| C01 | ≥2 `survey_flows` ativos | script | `regression-api-whatsapp.sh` | [ ] |
| C02 | Seeds delivery + reativação | script | idem | [ ] |
| C03 | Fila `homologacao-qa` existe | script | idem | [ ] |
| C04 | Tags e filas base | script | idem | [ ] |
| **D — Admin UI WhatsApp (readonly)** |
| D01 | Contatos, etiquetas, segmentos, pesquisas | e2e | `whatsapp-admin-readonly` | [ ] |
| D02 | Disparos, templates, mensagens, ajustes | e2e | idem | [ ] |
| D03 | Nova pesquisa: abre dialog e cancela | e2e | idem | [ ] |
| D04 | Histórico importação compacto | e2e | idem | [ ] |
| **E — Admin CMS (smoke sem edição)** |
| E01 | `/admin/cardapio` carrega | e2e | sem clicar Salvar | [ ] |
| E02 | `/admin/pages` carrega | e2e | sem publicar | [ ] |
| E03 | `/admin/header-footer` carrega | e2e | sem salvar | [ ] |
| **F — Contatos e importação (manual, dados QA)** |
| F01 | Importar `contatos-qa-homologacao.csv` + LGPD | manual | números reais da equipe | [ ] |
| F02 | Marcar tag homologação QA | manual | botão em Contatos | [ ] |
| F03 | Reimportar → duplicados | manual | T06 | [ ] |
| F04 | Opt-out não entra em fila | manual | T18 | [ ] |
| **G — Etiquetas e segmentos (manual)** |
| G01 | Criar etiqueta `[QA] Teste` | manual | depois excluir | [ ] |
| G02 | Marcar etiqueta em contato QA | manual | ContactTagsEditor | [ ] |
| G03 | Criar segmento com include | manual | contagem de clientes | [ ] |
| G04 | Excluir segmento `[QA]` criado | manual | não excluir filas sistema | [ ] |
| **H — Pesquisas (manual + script)** |
| H01 | Listar 2 pesquisas seed | manual | `/admin/pesquisas` | [ ] |
| H02 | Criar pesquisa `[QA] Rascunho` e excluir | manual | CRUD novo | [ ] |
| H03 | Campanha pesquisa QA | SQL | `seed-campanha-pesquisa-qa.sql` | [ ] |
| H04 | Dry-run disparo pesquisa | script | `broadcast:send` + `BROADCAST_DRY_RUN=true` | [ ] |
| H05 | Relatório multi-coluna + CSV | manual | `/admin/disparos/:id` | [ ] |
| **I — Disparo legado (homologação anterior)** |
| I01 | Campanha homologação informational | manual | `seed-homologacao-campaign.sql` | [ ] |
| I02 | Modal custo R$ 0,35 × N | manual | T16 | [ ] |
| I03 | Simular resposta webhook | script | `homologacao:simulate-response` | [ ] |
| I04 | Dedupe 1 voto/contato | script | rodar simulate 2× | [ ] |
| I05 | Export CSV respostas | manual | T27 | [ ] |
| **J — Infra Meta (bloqueado até coexistência)** |
| J01 | `meta:verify` CONNECTED + CLOUD_API | script | T28 | [ ] |
| J02 | Echo celular → conversas | manual | T29 | [ ] |
| J03 | Disparo real fila QA | manual | T30, `BROADCAST_DRY_RUN=false` | [ ] |

---

## Roteiro manual recomendado (ordem)

### 1. Automatizado (5–10 min)

```bash
npm run test:regression
npm run homologacao:test-hmac
```

### 2. Dados QA (uma vez por ambiente)

1. Ajustar telefones em `docs/qa-sample/contatos-qa-homologacao.csv`
2. `/admin/contatos` → Importar com checkbox LGPD
3. Marcar **Usar em homologação** nos 3 contatos

### 3. Campanha pesquisa sequencial

1. SQL Editor → `docs/qa-sample/seed-campanha-pesquisa-qa.sql`
2. `npm run broadcast:send -- <campaign_id>`
3. `/admin/disparos/<id>` → conferir destinatários dry-run
4. (Futuro) simular respostas sequenciais no webhook — ver `docs/HOMOLOGACAO-T01-T30.md`

### 4. Regressão CMS (2 min — só olhar)

1. `/admin/cardapio` — produtos e preços **iguais ao validado** (não editar)
2. `/admin/pages` — lista de páginas carrega
3. Site `/cardapio` — mesmo conteúdo visível ao cliente

---

## Critérios de aceite do pacote

- [ ] `npm run test:regression` verde (ou só skips de admin sem .env)
- [ ] Nenhum passo acima alterou rascunho/publicação CMS
- [ ] Pesquisas seed visíveis no painel
- [ ] Fila QA com contatos e campanha dry-run OK
- [ ] Documentação `docs/HOMOLOGACAO-T01-T30.md` ainda válida para Meta bloqueada

---

## Referências

- [README.md](./README.md) — artefatos QA
- [../HOMOLOGACAO-T01-T30.md](../HOMOLOGACAO-T01-T30.md) — checklist original T01–T30
- [../PESQUISAS-WHATSAPP.md](../PESQUISAS-WHATSAPP.md) — guia Rosa
