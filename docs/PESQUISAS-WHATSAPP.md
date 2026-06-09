# Pesquisas no WhatsApp — guia para Rosa

## O que mudou

Agora dá para enviar **pesquisas com várias perguntas** direto no WhatsApp. O cliente responde no próprio chat — **sem abrir link de formulário**.

Também dá para **etiquetar clientes** e criar **segmentos** para campanhas futuras.

---

## Pesquisas prontas

### 1. Pesquisa delivery — clientes ativos
- **6 perguntas** sobre frequência, motivos, avaliação do delivery, melhorias e sugestões
- **Segmento sugerido:** clientes ativos
- **Etiqueta automática ao concluir:** pesquisa-delivery-respondeu

### 2. Pesquisa reativação — clientes inativos
- **4 perguntas** sobre por que parou de pedir, se voltaria e o que melhorar
- **Segmento sugerido:** clientes inativos
- **Etiqueta automática ao concluir:** pesquisa-reativacao-respondeu

---

## Passo a passo (Rosa)

### 1. Etiquetas (`/admin/etiquetas`)
1. Toque em **Nova etiqueta**
2. Dê um nome simples (ex.: "Zona Sul", "Cliente VIP")
3. Escolha uma cor
4. Pronto — use nas fichas dos clientes

### 2. Marcar clientes (`/admin/contatos`)
1. Abra a lista de clientes
2. No cliente, toque em **Etiquetas**
3. Toque nas etiquetas para ligar/desligar

### 3. Segmentos (`/admin/segmentos`)
1. Toque em **Novo segmento**
2. Escolha quais etiquetas **incluem** o cliente no grupo
3. (Opcional) Escolha etiquetas que **excluem** alguém
4. Veja quantos clientes entram no segmento

### 4. Pesquisas (`/admin/pesquisas`)
- **Nova pesquisa** — nome, mensagem de abertura e perguntas em sequência
- Tipos de pergunta: escolher opção (2 a 10) ou texto livre
- **Editar** ou **Excluir** pesquisas antigas (exclusão oculta da lista; histórico de campanhas permanece)

### 5. Disparar campanha (`/admin/disparos`)
1. **Nova campanha**
2. Escolha um **modelo aprovado** pela Meta (abre a conversa)
3. Tipo: **Pesquisa**
4. Escolha qual pesquisa
5. Escolha o **segmento** de destinatários
6. **Publicar** → **Disparar**
7. Veja respostas em **Ver relatório** (uma coluna por pergunta + exportar CSV)

---

## Como o cliente vê

1. Recebe o modelo aprovado (mensagem inicial da campanha)
2. Responde qualquer coisa — abre a janela de 24h
3. Recebe a introdução da pesquisa
4. Recebe **uma pergunta por vez**:
   - Até 3 opções → botões
   - 4 a 10 opções → lista para escolher
   - Pergunta aberta → digita texto livre
5. Ao terminar: "Obrigada! Sua resposta foi registrada 🍕"

---

## Bloqueio atual (Meta)

Enquanto a **coexistência não for aprovada**, os envios reais ficam em **dry-run** (`BROADCAST_DRY_RUN=true`).

O painel, etiquetas, segmentos e relatórios já funcionam — só o WhatsApp real aguarda a Meta.

---

## Comandos técnicos (Janaina)

```bash
# Migrations + seeds das pesquisas
npm run db:deploy

# Edge Functions
npm run functions:deploy:webhook
npm run functions:deploy:broadcast-send

# Tipos TypeScript
npm run db:types
```

Migrations desta feature:
- `20260604100000_survey_flows_sessions.sql`
- `20260604100100_survey_flows_seed_pesquisas.sql`
- `20260604100200_broadcast_campaign_survey_flow_draft.sql`
