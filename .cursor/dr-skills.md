# Dona Rosa Squad — Skills & Snippets de Referência

Snippets reutilizáveis para o workflow de squad da Dona Rosa Pizzaria.
Adicione como **Notepad** no Cursor para acesso rápido em qualquer conversa.

---

## Stack do projeto

| Camada | Tech |
|--------|------|
| Frontend | React + TypeScript + Vite |
| Estilo | Tailwind CSS + shadcn/ui |
| Dados async | TanStack Query |
| Backend/CMS/Auth | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Hospedagem | Vercel |
| Integração atual | WhatsApp Business (Meta Graph API) |

---

## Variáveis de ambiente

**No cliente (seguras, expostas no bundle):**
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_PUBLIC_SITE_URL
```

**Supabase Secrets (nunca no cliente, nunca VITE_*):**
```
META_APP_SECRET          → validação HMAC webhook
META_ACCESS_TOKEN        → envio via Graph API
META_PHONE_NUMBER_ID     → ID do número WhatsApp Business
META_VERIFY_TOKEN        → verificação inicial do webhook Meta
```

---

## Skill: Business Rule — formato canônico Dona Rosa

```
BR-[N]: [Sujeito] [condição/ação] [restrição].

Exemplos:
BR-01: Apenas usuários autenticados com role `admin` acessam o inbox de WhatsApp.
BR-02: Mensagens recebidas fora da janela de 24h só podem ser respondidas via template aprovado pela Meta.
BR-03: Toda mensagem persistida mantém o `meta_message_id` para deduplicação — o webhook pode ser reenviado.
BR-04: Status de pedido só pode avançar (novo → em preparo → saiu → entregue), nunca regredir.
BR-05: Exclusão de conversas é soft-delete — `archived_at` timestamptz, nunca DELETE físico.
```

---

## Skill: Template WhatsApp Business (Meta)

```
Nome: [snake_case — ex: confirmacao_pedido]
Categoria: UTILITY
Idioma: pt_BR

Corpo:
Olá, {{1}}! 🍕 Seu pedido na Dona Rosa foi confirmado.
Estamos preparando com carinho. Previsão: {{2}}.
Qualquer dúvida é só responder aqui!

Variáveis:
  {{1}} → nome do cliente
  {{2}} → tempo estimado (ex: "40 minutos")

Restrições Meta:
- Sem URLs encurtadas
- Sem emojis excessivos
- Variáveis no formato {{N}} — inteiros sequenciais a partir de 1
- Máximo 1024 caracteres no corpo
```

Templates padrão para implementar:
- `confirmacao_pedido` (UTILITY)
- `status_em_preparo` (UTILITY)
- `status_saiu_entrega` (UTILITY)
- `status_entregue` (UTILITY)
- `boas_vindas` (UTILITY — primeiro contato)
- `fora_do_horario` (UTILITY — pizzaria fechada)

---

## Skill: Migration Supabase — padrão do projeto

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_[descricao].sql

-- Sempre aditivo em produção (sem DROP em dados vivos sem confirmação)
-- Sempre com RLS habilitado
-- Sempre soft-delete para dados auditáveis

CREATE TABLE public.whatsapp_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES public.whatsapp_conversations(id),
  meta_message_id   text UNIQUE NOT NULL,   -- deduplicação
  direction         text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type      text NOT NULL DEFAULT 'text',
  content           text,
  status            text NOT NULL DEFAULT 'sent',
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_messages" ON public.whatsapp_messages
  FOR ALL USING (auth.role() = 'authenticated');
```

---

## Skill: Edge Function — validação HMAC Meta

```typescript
// Sempre a primeira operação em webhooks Meta
async function validateMetaSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('X-Hub-Signature-256');
  if (!signature) return false;

  const secret = Deno.env.get('META_APP_SECRET')!;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = 'sha256=' + Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Timing-safe comparison
  return signature.length === expected.length &&
    crypto.subtle.timingSafeEqual
      ? true // use timingSafeEqual se disponível
      : signature === expected;
}
```

---

## Skill: Hook TanStack Query — padrão Dona Rosa

```typescript
// src/hooks/useWhatsappConversations.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsappConversation } from '@/integrations/supabase/types/whatsapp';

export function useWhatsappConversations() {
  return useQuery<WhatsappConversation[]>({
    queryKey: ['whatsapp', 'conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
```

---

## Skill: Padrão de estados no componente

```tsx
// Sempre tratar todos os 4 estados
const { data: conversations, isLoading, error } = useWhatsappConversations();

if (isLoading) return <ConversationListSkeleton />;
if (error) return (
  <ErrorState message="Não foi possível carregar as conversas. Tente novamente." />
);
if (!conversations?.length) return (
  <EmptyState message="Nenhuma mensagem ainda. Quando clientes entrarem em contato, aparecerão aqui." />
);
return <ConversationList conversations={conversations} />;
```

---

## Regras de negócio permanentes (nunca quebre)

| Regra | Por quê importa |
|-------|----------------|
| `useHomeBootstrap` / `useSiteShellReady` nunca removidos | Evita placeholder vazio no primeiro paint |
| `/admin` e `/login` com noindex | Não indexados por buscadores |
| Conteúdo via Supabase, nunca hardcoded | Proprietária edita sem deploy |
| `VITE_PUBLIC_SITE_URL` correto por ambiente | Canonical, OG, JSON-LD dependem disso |
| Migrations em `supabase/migrations/` versionadas | Rastreabilidade e reprodutibilidade |
| `.env` nunca commitado, `service_role_key` nunca no frontend | Segurança |
| `vercel.json` com rewrite SPA | Sem isso, rotas diretas retornam 404 |

---

## Checklist go-live WhatsApp

- [ ] Edge Functions deployadas (`whatsapp-webhook`, `send-whatsapp-message`)
- [ ] Secrets Meta configurados no Supabase
- [ ] Webhook verificado no Meta Business Manager
- [ ] Webhook fields ativos: `messages`, `message_deliveries`, `message_reads`
- [ ] Templates aprovados pela Meta
- [ ] Realtime habilitado em `whatsapp_messages`
- [ ] `.env.example` atualizado (sem valores)
- [ ] README.md (Guia do Desenvolvedor) atualizado
- [ ] Keep-alive GitHub Action ainda funcionando
- [ ] `sitemap.xml` com URL base correta (não `example.com`)
