# /dr-fase5 — Testes em Ambiente Controlado + Homologação Final

> **Contexto:** Todas as features implementadas (Fases 1–4 concluídas).
> A Fase 5 é a homologação completa do sistema antes da entrega à cliente.
> Inclui testes com dados reais em ambiente controlado, ajustes finais e
> entrega do treinamento de uso do painel para a Dona Rosa.
> **Estimativa:** 6 horas / 2 dias úteis.

---

## AGENTE 1 — PM Agent: Critérios de Aceite Final

Revisite o escopo completo da proposta aprovada e confirme que cada módulo foi entregue:

```
Módulo 1 — Infraestrutura e Auditoria de Linha
[ ] Conta Meta Cloud API configurada e homologada
[ ] Webhook verificado e ativo no Meta Business Manager
[ ] Número WhatsApp Business vinculado e funcionando

Módulo 2 — Gestão de Contatos
[ ] Importação de CSV funcionando (até 5.000 linhas)
[ ] Normalização de telefones para E.164
[ ] Controle de opt-out implementado
[ ] Relatório de importação (importados / duplicados / erros)

Módulo 3 — Criação de Mensagens Ativas
[ ] Interface de criação de templates no backoffice
[ ] Submissão para aprovação Meta via API
[ ] Preview visual fiel ao WhatsApp
[ ] Status de aprovação atualizado corretamente

Módulo 4 — Automação da Pesquisa Interna
[ ] Disparo em lote com rate limiting (50/s)
[ ] Botões de resposta rápida nativos (interactive/button)
[ ] Webhook computa votos em < 5s
[ ] Deduplicação de votos por contato por campanha
[ ] Contatos opted-out excluídos automaticamente

Módulo 5 — Relatórios e Gráficos
[ ] Cards de métricas (enviados, entregues, responderam)
[ ] Gráfico de rosca com distribuição de respostas
[ ] Atualização em tempo real via Realtime
[ ] Exportação de resultados em CSV
```

Qualquer item não marcado como concluído deve gerar um **blocking issue** antes de prosseguir.

---

## AGENTE 2 — DevOps: Ambiente de Testes Controlado

### 2.1 Configurar lista de contatos de teste

Antes de qualquer teste real, configure uma lista controlada:
- Mínimo 3 números reais de teste (Janaina + equipe de confiança)
- Criar segmento "QA" no banco: `tag = 'qa_test'` em `whatsapp_contacts`
- Todos os disparos de homologação usam apenas este segmento

### 2.2 Template de teste para homologação
Criar e submeter para aprovação na Meta um template exclusivo de teste:
```
Nome: teste_homologacao_dona_rosa
Corpo: "Olá! Esta é uma mensagem de teste da Dona Rosa Pizzaria. 
Por favor, ignore — estamos homologando nosso sistema. 🍕"
```

### 2.3 Verificar configurações de produção
```
[ ] VITE_PUBLIC_SITE_URL correto em produção (não localhost)
[ ] sitemap.xml com URL base correta (não example.com)
[ ] /admin e /login com noindex confirmados
[ ] Todas as Edge Functions deployadas na versão mais recente
[ ] Secrets Meta presentes e corretos no Supabase
[ ] Keep-alive GitHub Action executando corretamente
[ ] .env.example atualizado com todas as variáveis necessárias
[ ] README.md (Guia do Desenvolvedor) atualizado com a integração WhatsApp
```

---

## AGENTE 3 — QA: Roteiro Completo de Homologação

Execute este roteiro na ordem, com os contatos de teste configurados pelo DevOps.

### BLOCO 1 — Infraestrutura (Fase 1)
```
[ ] T01: Enviar mensagem de teste pelo Meta Business Manager → confirmar chegada no webhook_events
[ ] T02: Webhook com assinatura inválida → retorna 403, nada no banco
[ ] T03: GET de verificação do webhook → responde hub.challenge corretamente
[ ] T04: Edge Function logs acessíveis no Supabase Dashboard (sem erros críticos)
```

### BLOCO 2 — Contatos (Fase 2)
```
[ ] T05: Importar CSV com 10 contatos de teste → todos importados corretamente
[ ] T06: Reimportar o mesmo CSV → 10 duplicados ignorados, resumo correto
[ ] T07: Importar CSV com 2 números inválidos + 8 válidos → 8 importados, 2 rejeitados com detalhe
[ ] T08: Importar CSV sem coluna de telefone → erro antes de processar
[ ] T09: Marcar 1 contato como opted-out → confirmação exibida
[ ] T10: Tentativa de incluir opted-out em campanha → automaticamente excluído
```

### BLOCO 3 — Templates (Fase 3)
```
[ ] T11: Criar template com variáveis → preview exibe corretamente com valores de exemplo
[ ] T12: Submeter template para aprovação → status muda para "Aguardando aprovação"
[ ] T13: Simular template aprovado (atualizar manualmente no banco) → aparece disponível no wizard de campanha
[ ] T14: Template com status pending não aparece na seleção de campanha
```

### BLOCO 4 — Disparo (Fase 3)
```
[ ] T15: Criar campanha com 3 contatos de teste → wizard exibe custo estimado correto
[ ] T16: Confirmar disparo → mensagens chegam nos 3 celulares de teste
[ ] T17: Status da campanha atualiza para "completed" após envio
[ ] T18: Métricas de enviados/entregues atualizam corretamente
[ ] T19: Contato opted-out não recebe a mensagem
```

### BLOCO 5 — Pesquisa e Dashboard (Fase 4)
```
[ ] T20: Responder botão "Excelente" no celular de teste → voto em < 5s no banco
[ ] T21: Dashboard atualiza em tempo real sem refresh
[ ] T22: Responder novamente pelo mesmo número → segundo voto ignorado
[ ] T23: Gráfico de rosca exibe distribuição correta
[ ] T24: Exportar CSV → arquivo baixado com dados mascarados
[ ] T25: Telefone no dashboard aparece mascarado (+55119****8888)
```

### BLOCO 6 — Regressão das Regras Permanentes
```
[ ] T26: Home do site público carrega sem placeholder (useHomeBootstrap ok)
[ ] T27: Cardápio e galeria carregam corretamente
[ ] T28: /admin com noindex (inspecionar meta robots)
[ ] T29: Rotas diretas (/cardapio, /admin) funcionam após reload (vercel.json SPA ok)
[ ] T30: Usuário não autenticado redirecionado de /admin para /login
```

### Critério de aprovação:
- **0 falhas nos blocos 1–4** (infraestrutura, dados, templates, disparo)
- **0 falhas no T20–T22** (pesquisa e deduplicação de votos)
- **Falhas menores** (estéticas, copy, UX) podem ir para lista de ajustes sem bloquear entrega

---

## AGENTE 4 — UX Writer: Documento de Treinamento para a Dona Rosa

Produza um **guia de uso simplificado** para a proprietária, em linguagem completamente não técnica:

```markdown
# Como usar sua Central de WhatsApp — Dona Rosa Pizzaria

## 1. Importar sua lista de clientes
1. Acesse o painel em [URL] e faça login
2. Clique em "Contatos" no menu lateral
3. Clique em "Importar CSV"
4. Selecione seu arquivo de clientes
5. Aguarde o resumo: quantos foram adicionados e se houve algum problema

## 2. Criar uma mensagem para enviar
1. Clique em "Templates" no menu
2. Clique em "Novo Template"
3. Escreva sua mensagem (use {{1}} onde quer que o nome do cliente apareça)
4. Clique em "Enviar para aprovação"
5. Aguarde a Meta aprovar (geralmente 24h)

## 3. Enviar uma campanha
1. Quando o template aparecer como "Aprovado", clique em "Campanhas"
2. Clique em "Nova Campanha"
3. Escolha o template → escolha os contatos → confirme o custo estimado
4. Clique em "Confirmar Disparo"
5. Acompanhe o envio em tempo real na tela

## 4. Ver os resultados da pesquisa
1. Clique em "Campanhas" e abra a campanha enviada
2. Os resultados aparecem automaticamente conforme os clientes respondem
3. Para salvar os resultados, clique em "Exportar resultados (.csv)"

## ⚠️ Pontos importantes
- O custo de envio é cobrado diretamente pela Meta no seu cartão
- Clientes que pediram para não receber mensagens são removidos automaticamente
- Nunca compartilhe seu login e senha com ninguém
```

---

## AGENTE 5 — PM Agent: Sprint Review Final

Produza o **relatório de entrega** do projeto completo:

### O que foi entregue:
[Lista de todos os módulos e features concluídos]

### Métricas do projeto:
- Horas estimadas: 36h
- Horas realizadas: [preencher]
- Fases: 5 de 5 concluídas

### Riscos identificados para o futuro:
- Tier 1 da Meta limita 1.000 conversas/dia — precisará de upgrade conforme crescimento
- Plano gratuito Supabase: keep-alive necessário, avaliar upgrade se volume aumentar
- Templates precisam re-aprovação da Meta se o conteúdo for alterado

### Recomendações para próximos ciclos:
- Monitoramento de entregabilidade (taxa abaixo de 80% pode indicar problema no número)
- Evolução para inbox bidirecional (responder mensagens individuais dos clientes)
- Agendamento de campanhas (disparar em horário programado)
- Segmentação de contatos por tags (VIP, novos, inativos)

### Documentação atualizada:
- [ ] README.md (Guia do Desenvolvedor) — seções de variáveis de ambiente e arquitetura
- [ ] Guia de uso para a proprietária entregue

**Projeto finalizado. Parabéns à squad! 🍕**
