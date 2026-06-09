/**
 * Rotas cujo conteúdo editorial está validado em produção.
 * Testes e2e NÃO devem submeter formulários nem clicar em Salvar/Publicar nestas áreas.
 */
export const CMS_READONLY_ROUTES = [
  "/",
  "/cardapio",
  "/quem-somos",
  "/contato",
] as const;

/** Admin CMS — apenas smoke de carregamento; sem interação de edição. */
export const ADMIN_CMS_READONLY_ROUTES = [
  "/admin/cardapio",
  "/admin/pages",
  "/admin/header-footer",
] as const;

/** Módulos WhatsApp/CRM — permitido navegar e abrir diálogos se cancelar sem salvar. */
export const WHATSAPP_ADMIN_ROUTES = [
  { path: "/admin/dashboard", heading: /início|dashboard|painel/i },
  { path: "/admin/contatos", heading: /contatos/i },
  { path: "/admin/etiquetas", heading: /etiquetas/i },
  { path: "/admin/segmentos", heading: /segmentos/i },
  { path: "/admin/pesquisas", heading: /pesquisas/i },
  { path: "/admin/disparos", heading: /promoções/i },
  { path: "/admin/templates", heading: /mensagens prontas|templates/i },
  { path: "/admin/conversas", heading: /mensagens|conversas/i },
  { path: "/admin/configuracoes", heading: /ajustes|configurações/i },
] as const;

export const FORBIDDEN_E2E_ACTIONS = [
  "Salvar",
  "Publicar",
  "Salvar rascunho",
  "Enviar para aprovação",
] as const;
