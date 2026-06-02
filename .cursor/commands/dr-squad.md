# /dr-squad — Workflow completo Dona Rosa Pizzaria

Execute o workflow completo de squad para a funcionalidade descrita. Ordem obrigatória — não pule fases.

## Fase 1 — PM Agent
PRD completo: Feature Description, Problem Statement, Business Rules (numeradas e testáveis), Acceptance Scenarios (Given/When/Then), Out of Scope, Open Questions.
Contexto: pizzaria artesanal, proprietária não técnica, integração WhatsApp Business.

Pause e aguarde confirmação.

---

## Fase 2 — UX Writer Agent *(junto com UX)*
Templates WhatsApp Business para Meta + microcopy do backoffice para esta feature.
Tom: acolhedor, direto, sem jargão técnico. Português brasileiro informal.

Pause e aguarde confirmação.

---

## Fase 3 — UX Agent
Personas & Goals · User Journey no /admin · Screen & Component Inventory · Mobile-first notes · Edge Cases & Empty States.
Proprietária Rosa opera no celular — cada tela deve ser óbvia na primeira vez.

Pause e aguarde confirmação.

---

## Fase 4 — Arquiteto Supabase *(antes do frontend)*
Schema de tabelas · Migrations SQL com RLS · Edge Functions (assinatura, responsabilidade, secrets) · Realtime · Tipos TypeScript · Execution Prompts.
NUNCA sugerir `supabase db push` sem o usuário pedir.

Pause e aguarde confirmação.

---

## Fase 5 — Dev Backend
Implementar Edge Functions (webhook Meta, send-message) · Hooks TanStack Query · Tipos alinhados ao schema · Realtime subscriptions.
Validação HMAC antes de qualquer DB operation. Resposta < 20s para Meta.

Pause e aguarde confirmação.

---

## Fase 6 — Dev Frontend
Implementar telas /admin + componentes React · Todos os estados (loading, empty, error, success) · Guards de carregamento respeitados · shadcn/ui · Mobile-first.

Pause e aguarde confirmação.

---

## Fase 7 — DevOps
Configurar secrets Supabase · Deploy Edge Functions · Webhook Meta no Business Manager · Realtime habilitado · .env.example atualizado · Checklist de go-live.

Pause e aguarde confirmação.

---

## Fase 8 — QA
E2E scenarios · Segurança HMAC/RLS · Regressão das regras permanentes · Findings.
Sprint Review: o que foi entregue, riscos, follow-ups.
Atualizar README.md (Guia do Desenvolvedor) na mesma entrega.

---

**Funcionalidade:** $[FEATURE_DESCRIPTION]
