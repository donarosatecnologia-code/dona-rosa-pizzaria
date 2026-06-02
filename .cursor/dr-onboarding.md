# /dr-onboarding — Onboarding completo da squad no projeto Dona Rosa Pizzaria

Você vai conduzir o **onboarding técnico e de negócio** de toda a squad no projeto Dona Rosa Pizzaria.
Cada integrante da squad vai ler o projeto, aprender o que precisa saber sobre suas responsabilidades e documentar seus achados.

**Execute fase por fase, na ordem abaixo. Não pule etapas.**

---

## ANTES DE COMEÇAR — Leitura obrigatória do projeto

Leia os seguintes arquivos e absorva tudo antes de qualquer análise:

```
@README.md
@package.json
@src/
@supabase/
@vercel.json
@.env.example
@.github/
@public/
```

Se algum arquivo relevante não estiver listado acima, explore a estrutura do projeto com `list_dir` ou `read_file` antes de prosseguir.

---

## FASE 1 — PM Agent: Entendendo o negócio

Ative o **PM Agent** (`dr-pm-agent.mdc`) e produza:

### 1.1 Visão geral do produto
- O que é a Dona Rosa Pizzaria (produto digital)?
- Quem são os usuários? (proprietária, clientes finais, futuros atendentes?)
- Qual problema o sistema resolve hoje?

### 1.2 Funcionalidades existentes mapeadas
Liste todas as features já implementadas que você consegue identificar no código e na documentação. Para cada uma:
```
Feature: [nome]
Status: implementada / parcialmente implementada / planejada
Área: site público | backoffice /admin | infraestrutura
Resumo: [uma frase]
```

### 1.3 Regras de negócio identificadas
Documente no formato canônico (`BR-[N]: ...`) todas as regras de negócio que conseguir extrair do código, do README e dos comentários. Seja rigoroso — regras implícitas no código também contam.

### 1.4 Gaps e oportunidades
O que o produto ainda não faz mas claramente precisará? O que está incompleto?

### 1.5 Contexto do próximo ciclo
Registre: o próximo desenvolvimento é a **integração WhatsApp Business (Meta)** no backoffice, permitindo que a proprietária gerencie conversas e pedidos de clientes sem sair do `/admin`.

---

## FASE 2 — UX Writer Agent: Voz e tom atual

Ative o **UX Writer Agent** (`dr-uxwriter-agent.mdc`) e produza:

### 2.1 Inventário de copy existente
Mapeie todos os textos voltados ao usuário que encontrar no código:
- Mensagens de erro e sucesso
- Labels de botões e campos
- Textos de empty states
- Títulos de seção no backoffice
- Textos do site público (se hardcoded ou em CMS)

### 2.2 Avaliação do tom atual
O copy existente segue a voz da marca Dona Rosa (acolhedor, direto, PT-BR informal)? Identifique inconsistências.

### 2.3 Gaps de copy para a integração WhatsApp
Quais textos ainda precisarão ser escritos para a feature de WhatsApp Business? Liste os templates Meta e o microcopy do backoffice que serão necessários.

---

## FASE 3 — UX Agent: Interface e fluxos atuais

Ative o **UX Agent** (`dr-ux-agent.mdc`) e produza:

### 3.1 Mapa de rotas e telas
Liste todas as rotas identificadas no projeto (`/`, `/cardapio`, `/admin`, `/login`, etc.) e o que cada uma faz.

### 3.2 Componentes de UI existentes
Mapeie os componentes em `src/components/` e `src/pages/`. Para cada um, identifique:
- Propósito
- Onde é usado
- Se usa shadcn/ui ou é customizado

### 3.3 Padrões de UX identificados
- Como o projeto trata loading states hoje? (`useHomeBootstrap`, `useSiteShellReady`)
- Como trata erros?
- Como trata empty states?
- O que está consistente? O que diverge?

### 3.4 Pontos de atenção mobile
O site público e o backoffice estão mobile-first? Identifique problemas potenciais.

### 3.5 O que precisa ser criado para o WhatsApp
Quais telas e componentes ainda não existem e serão necessários para a inbox de WhatsApp no backoffice?

---

## FASE 4 — Arquiteto Supabase: Schema e infraestrutura de dados

Ative o **Arquiteto Supabase** (`dr-arch-agent.mdc`) e produza:

### 4.1 Schema atual do banco
Leia os arquivos em `supabase/migrations/` e documente todas as tabelas existentes:

```
Tabela: [nome]
Propósito: [uma frase]
Colunas principais: [lista]
RLS: habilitado / desabilitado
Políticas identificadas: [resumo]
Relações: [FK para outras tabelas]
```

### 4.2 Edge Functions existentes
Liste as Edge Functions em `supabase/functions/` (se existirem). Para cada uma:
- Nome e caminho
- Trigger (HTTP, webhook, scheduled)
- Responsabilidade
- Secrets necessários

### 4.3 Uso de Realtime e Storage
O projeto usa Supabase Realtime? Storage? Documente o que encontrar.

### 4.4 Variáveis de ambiente e secrets
Compare `.env.example` com o que o código usa. Está tudo documentado?

### 4.5 O que precisará ser criado para o WhatsApp
Quais tabelas, migrations, Edge Functions e configurações Supabase ainda não existem e serão necessárias para a integração WhatsApp Business?

---

## FASE 5 — Dev Backend: Lógica de dados e integrações

Ative o **Dev Backend** (`dr-backend-agent.mdc`) e produza:

### 5.1 Hooks e queries existentes
Mapeie os hooks em `src/hooks/` e as queries Supabase no projeto. Para cada hook relevante:
- Nome e arquivo
- O que busca/muta
- Query key (TanStack Query)
- Tratamento de erro

### 5.2 Integrações externas atuais
O projeto já consome alguma API externa além do Supabase? Documente.

### 5.3 Padrões de acesso a dados
Como o projeto acessa o Supabase hoje? (`src/integrations/supabase/client.ts`). Existe uma camada de abstração ou é direto nos hooks?

### 5.4 O que precisará ser implementado para o WhatsApp
Quais hooks, Edge Functions e integrações Meta ainda precisarão ser criados? Identifique dependências e ordem de implementação sugerida.

---

## FASE 6 — Dev Frontend: Código e padrões de implementação

Ative o **Dev Frontend** (`dr-frontend-agent.mdc`) e produza:

### 6.1 Arquitetura de componentes
Como o projeto organiza `pages/`, `components/` e `hooks/`? O padrão é consistente?

### 6.2 Guards de carregamento — análise crítica
`useHomeBootstrap` e `useSiteShellReady`: onde são usados, como funcionam, quais páginas ainda não os usam (e deveriam)?

### 6.3 Padrões TypeScript
O projeto usa tipos do Supabase gerados automaticamente ou tipos manuais? Onde ficam os tipos?

### 6.4 Dependências relevantes
Do `package.json`, liste as bibliotecas mais importantes além da stack principal e para que servem.

### 6.5 Dívida técnica identificada
`any` sem justificativa, `// TODO`, componentes duplicados, padrões inconsistentes — liste o que encontrar.

### 6.6 O que precisará ser construído para o WhatsApp
Quais componentes, páginas e hooks de UI ainda não existem? Proponha a estrutura de arquivos.

---

## FASE 7 — DevOps Agent: Infraestrutura e deploy

Ative o **DevOps Agent** (`dr-devops-agent.mdc`) e produza:

### 7.1 Pipeline de deploy atual
Como funciona o deploy? (Vercel + branch principal). O `vercel.json` está correto para SPA?

### 7.2 GitHub Actions existentes
Leia `.github/workflows/`. O que está automatizado? O keep-alive está configurado corretamente?

### 7.3 Configuração do Supabase keep-alive
O projeto está em plano gratuito. O keep-alive está funcional? O que pode falhar?

### 7.4 Checklist de configuração para novo desenvolvedor
Com base no que leu, escreva um checklist resumido de tudo que um novo dev precisa configurar para rodar o projeto localmente.

### 7.5 O que precisará ser configurado para o WhatsApp
Secrets Meta, webhook URL, deploy de novas Edge Functions — liste tudo que a infra precisará.

---

## FASE 8 — QA Agent: Qualidade e riscos atuais

Ative o **QA Agent** (`dr-qa-agent.mdc`) e produza:

### 8.1 Testes existentes
O projeto tem testes? (`npm run test` → Vitest). O que está coberto? O que não está?

### 8.2 Riscos identificados no código atual
Com base na leitura do projeto, liste riscos de qualidade, segurança ou confiabilidade que já existem — antes mesmo da feature de WhatsApp.

### 8.3 Regras de negócio permanentes — validação
As regras listadas no README (`Regras de negócio — não quebre isso`) estão de fato implementadas e funcionando? Identifique qualquer divergência entre documentação e código.

### 8.4 Checklist de saúde do projeto
```
[ ] Guards de carregamento implementados em todas as páginas públicas
[ ] /admin e /login com noindex
[ ] .env não commitado (verificar .gitignore)
[ ] Migrations versionadas e completas
[ ] service_role_key ausente no bundle do cliente
[ ] vercel.json com rewrite SPA
[ ] sitemap.xml com URL base correta (não example.com)
[ ] keep-alive funcionando (último run no GitHub Actions)
```

### 8.5 O que testar na integração WhatsApp
Antecipe os cenários de QA mais críticos para a feature que será desenvolvida.

---

## RESULTADO FINAL — Documento de Onboarding da Squad

Ao final de todas as fases, consolide um **resumo executivo** com:

1. **O que o projeto é** (2-3 frases)
2. **Stack e arquitetura** (lista rápida)
3. **Funcionalidades existentes** (lista)
4. **Regras de negócio permanentes** (lista numerada BR-N)
5. **Riscos e dívida técnica identificados** (lista priorizada)
6. **O que precisa ser construído para o WhatsApp Business** (por área: banco, backend, frontend, infra, copy)
7. **Checklist de setup local para novo dev**

Salve ou exiba este documento ao final — é o ponto de partida para qualquer próxima feature.
