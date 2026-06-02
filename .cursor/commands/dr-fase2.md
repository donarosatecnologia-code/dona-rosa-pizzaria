# /dr-fase2 — Gestão de Contatos (Importação CSV + Armazenamento)

> **Contexto:** A infraestrutura Meta Cloud API está conectada ao Supabase (Fase 1 concluída).
> A Fase 2 entrega a tela de importação de contatos via CSV no painel `/admin`,
> com armazenamento estruturado para controle de envios futuros.
> **Base:** ~2.000 contatos. **Estimativa:** 6 horas / 2 dias úteis.

Execute cada agente na ordem abaixo.

---

## AGENTE 1 — PM Agent

Produza o PRD da Fase 2:

**Feature:** Área segura no backoffice `/admin` para importação de lista de clientes via CSV,
com armazenamento estruturado que permita controle de envios, opt-out e histórico de campanhas.

Business Rules obrigatórias:
```
BR-01: Apenas usuários autenticados com role `admin` podem acessar e importar contatos.
BR-02: O CSV deve conter obrigatoriamente coluna de número de telefone em formato válido (aceitar com e sem +55, com e sem DDD).
BR-03: Números duplicados no mesmo CSV ou já existentes no banco são ignorados silenciosamente (sem erro), mas contabilizados no relatório de importação.
BR-04: Números no formato inválido são rejeitados linha a linha e listados no relatório de erros, sem bloquear o restante da importação.
BR-05: Todo contato importado tem status inicial `active`. Contatos podem ser marcados como `opted_out` e nunca mais recebem disparos.
BR-06: A importação é não-destrutiva — nunca apaga contatos anteriores, apenas adiciona novos.
BR-07: O sistema deve suportar CSVs de até 5.000 linhas sem timeout ou falha.
BR-08: Após importação, exibir resumo: total lido, total importado, duplicados ignorados, erros de formato.
```

Acceptance Scenarios:
- Happy path: CSV válido com 2.000 contatos → importação concluída → resumo exibido
- Negativo: CSV com números inválidos → linhas rejeitadas, resto importado, relatório de erros
- Negativo: CSV com todos duplicados → 0 importados, mensagem clara
- Edge: CSV vazio ou sem coluna de telefone → erro antes de processar
- Permissão: usuário não autenticado tenta acessar a rota → redirect para `/login`

Aguarde confirmação.

---

## AGENTE 2 — UX Writer Agent

Produza o microcopy da tela de importação de contatos:

### Textos necessários:
| Elemento | Copy |
|---|---|
| Título da página | "Contatos" |
| Subtítulo | "Importe sua lista de clientes para disparar campanhas pelo WhatsApp." |
| Botão importar | "Importar CSV" |
| Instrução do campo | "Selecione um arquivo .csv com uma coluna de número de telefone." |
| Link de ajuda | "Como formatar o arquivo?" |
| Status: processando | "Importando contatos... isso pode levar alguns segundos." |
| Sucesso | "Importação concluída! {N} contatos adicionados." |
| Duplicados | "{N} números já existentes foram ignorados." |
| Erros de formato | "{N} números inválidos foram pulados. Veja a lista abaixo." |
| Erro CSV inválido | "Não conseguimos ler este arquivo. Verifique se é um .csv válido com coluna de telefone." |
| Empty state (sem contatos) | "Nenhum contato ainda. Importe uma lista CSV para começar." |
| Coluna opt-out | "Parou de receber" |
| Tooltip opt-out | "Este cliente optou por não receber mensagens. Ele não será incluído em disparos." |

### Template de instrução de formato CSV (texto de ajuda):
```
Como formatar seu arquivo CSV:

• O arquivo deve ter extensão .csv
• Inclua uma coluna chamada "telefone" ou "phone" (sem espaços, sem acento)
• Números podem estar com ou sem o +55 e com ou sem o 9 extra
• Exemplo de conteúdo:
  nome,telefone
  Maria Silva,11999998888
  João Santos,+5511988887777
```

---

## AGENTE 3 — UX Agent

Projete a interface da tela de contatos no backoffice:

### Telas necessárias:
1. **`/admin/contatos`** — lista de contatos + botão de importação
2. **Modal de importação** — upload de arquivo + feedback de progresso + resumo pós-importação
3. **Linha da tabela** — nome, telefone, status (ativo/opt-out), data de cadastro, última campanha

### Estados por componente:

**Tabela de contatos:**
| Estado | O que Rosa vê |
|---|---|
| Loading | Skeleton com 5 linhas |
| Empty | Ilustração + "Nenhum contato ainda. Importe uma lista CSV para começar." + botão |
| Populada | Tabela paginada (50 por página), com busca por nome/número |
| Erro | "Não foi possível carregar os contatos. Tente novamente." |

**Modal de importação:**
| Estado | O que Rosa vê |
|---|---|
| Inicial | Área de drag-and-drop + botão "Selecionar arquivo" |
| Arquivo selecionado | Nome do arquivo + botão "Importar agora" |
| Processando | Spinner + "Importando contatos..." |
| Sucesso | Ícone verde + resumo (importados / duplicados / erros) |
| Erro parcial | Resumo de sucesso + lista colapsável de linhas com erro |
| Erro total | Ícone vermelho + mensagem + botão "Tentar novamente" |

### Componentes shadcn/ui:
- `Dialog` — modal de importação
- `Table` + `TablePagination` — lista de contatos
- `Badge` — status ativo/opt-out
- `Input type="file"` com área de drag-and-drop customizada
- `Progress` — barra de progresso durante importação
- `Alert` — resumo pós-importação (success/warning/error)
- `Tooltip` — explicação do opt-out

Aguarde confirmação.

---

## AGENTE 4 — Arquiteto Supabase

Projete o schema para gestão de contatos:

### Migration: `supabase/migrations/YYYYMMDDHHMMSS_whatsapp_contacts.sql`

**`whatsapp_contacts`:**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
phone_number    text NOT NULL UNIQUE  -- formato E.164 normalizado (+5511999998888)
name            text
status          text NOT NULL DEFAULT 'active'  -- active | opted_out
opted_out_at    timestamptz
import_batch_id uuid  -- FK para whatsapp_import_batches
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**`whatsapp_import_batches`** — rastreia cada importação:
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
filename        text
total_rows      int
imported        int
duplicates      int
errors          int
error_details   jsonb  -- [{ line: N, value: "xxx", reason: "invalid_format" }]
status          text   -- processing | completed | failed
created_at      timestamptz DEFAULT now()
```

RLS em ambas: apenas `authenticated`.

### Lógica de normalização de telefone
Defina a função SQL ou TypeScript que:
1. Remove caracteres não numéricos
2. Adiciona +55 se ausente
3. Adiciona 9 após DDD se o número tiver 10 dígitos (ex: 11988887777 → +5511988887777)
4. Rejeita se não tiver entre 12 e 13 dígitos após normalização

### Tipos TypeScript
Exporte `WhatsappContact` e `WhatsappImportBatch` em `src/integrations/supabase/types/whatsapp.ts`.

Aguarde confirmação.

---

## AGENTE 5 — Dev Backend

Implemente a lógica de importação:

### 5.1 Função de normalização de telefone
```typescript
// src/lib/whatsapp/normalizePhone.ts
// Recebe: string em qualquer formato
// Retorna: { normalized: string | null, valid: boolean, reason?: string }
// Casos: com/sem +55, com/sem 9 extra, com/sem formatação
```

### 5.2 Função de importação CSV (client-side parse + server upsert)
```typescript
// src/lib/whatsapp/importContacts.ts
// 1. Parse do CSV com papaparse (já no projeto ou adicionar)
// 2. Detectar coluna de telefone (aceitar: "telefone", "phone", "cel", "celular", "numero", "número")
// 3. Detectar coluna de nome (aceitar: "nome", "name") — opcional
// 4. Para cada linha: normalizar telefone → validar → acumular válidos e inválidos
// 5. Criar registro em whatsapp_import_batches com status=processing
// 6. Upsert em lote em whatsapp_contacts (ignorar conflitos de phone_number)
// 7. Atualizar whatsapp_import_batches com resultado final
```

### 5.3 Hooks TanStack Query
```typescript
// src/hooks/useWhatsappContacts.ts — lista paginada com busca
// src/hooks/useImportContacts.ts — mutation de importação + invalidação
```

---

## AGENTE 6 — Dev Frontend

Implemente a tela `/admin/contatos`:

### Arquivos:
```
src/pages/admin/contatos/
  index.tsx              ← página principal (lista + botão importar)
src/components/admin/contatos/
  ContactsTable.tsx      ← tabela paginada com busca
  ContactStatusBadge.tsx ← badge ativo/opt-out
  ImportContactsModal.tsx ← modal de importação com drag-and-drop
  ImportSummary.tsx       ← resumo pós-importação
src/hooks/
  useWhatsappContacts.ts
  useImportContacts.ts
src/lib/whatsapp/
  normalizePhone.ts
  importContacts.ts
```

### Regras obrigatórias:
- Rota com guard de autenticação
- Todos os 4 estados tratados em cada componente (loading, empty, error, success)
- CSV parse no cliente (papaparse) — não enviar arquivo bruto para o servidor
- Feedback de progresso durante importação (não bloquear a UI)
- Tabela com paginação (50 por página) e busca por nome/telefone
- Mobile-first: tabela deve funcionar em tela de celular (scroll horizontal ou layout adaptado)

---

## AGENTE 7 — QA

Valide a Fase 2 completa:

### Cenários obrigatórios:
```
Test: Importação de CSV válido com 2.000 contatos
  Given: usuária autenticada na /admin/contatos
  When:  faz upload de CSV com 2.000 linhas válidas
  Then:  2.000 contatos persistidos, resumo exibido corretamente

Test: CSV com números em formatos variados
  Given: CSV com números: "11999998888", "+5511999998888", "(11) 99999-8888"
  When:  importação executada
  Then:  todos normalizados para E.164 e aceitos

Test: CSV com duplicados
  Given: 500 contatos já existentes no banco
  When:  CSV com os mesmos 500 + 500 novos
  Then:  500 importados, 500 duplicados ignorados, resumo correto

Test: CSV com números inválidos
  Given: CSV com 10 linhas inválidas misturadas com 90 válidas
  When:  importação executada
  Then:  90 importados, 10 listados como erro com detalhe do problema

Test: CSV sem coluna de telefone
  Given: arquivo CSV sem coluna reconhecível
  When:  upload executado
  Then:  erro antes de processar, nenhum dado persistido

Test: Usuário não autenticado
  Given: sessão expirada
  When:  tenta acessar /admin/contatos
  Then:  redirect para /login
```

### Checklist de segurança:
- [ ] RLS em `whatsapp_contacts` — nenhuma query sem autenticação retorna dados
- [ ] Número de telefone normalizado — nunca armazenado em formato ambíguo
- [ ] Opt-out irreversível via UI (sem botão de "reativar" sem confirmação explícita)
- [ ] Importação não expõe stack traces para o usuário

**Ao finalizar:** "Fase 2 validada. Gestão de Contatos implementada. Base pronta para a Fase 3 — Templates e Motor de Disparo."
