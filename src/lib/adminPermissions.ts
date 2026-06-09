export type AdminPermissionAction = "view" | "edit" | "delete";

export interface AdminModulePermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export type AdminPermissionsMap = Record<AdminModuleKey, AdminModulePermission>;

export const ADMIN_MODULE_KEYS = [
  "dashboard",
  "conversas",
  "contatos",
  "templates",
  "disparos",
  "pages",
  "cardapio",
  "header_footer",
  "configuracoes",
  "usuarios",
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULE_KEYS)[number];

/** Módulos exibidos ao convidar/editar usuário — todos os menus, exceto Equipe. */
export const ADMIN_ASSIGNABLE_MODULE_KEYS = ADMIN_MODULE_KEYS.filter(
  (key) => key !== "usuarios",
) as Exclude<AdminModuleKey, "usuarios">[];

export interface AdminModuleDefinition {
  key: AdminModuleKey;
  label: string;
  description: string;
  routePrefixes: string[];
}

export const ADMIN_MODULES: AdminModuleDefinition[] = [
  {
    key: "dashboard",
    label: "Início",
    description: "Painel com resumos, gráficos e atalhos",
    routePrefixes: ["/admin/dashboard", "/admin"],
  },
  {
    key: "conversas",
    label: "Mensagens",
    description: "Conversas WhatsApp, fila e respostas",
    routePrefixes: ["/admin/conversas"],
  },
  {
    key: "contatos",
    label: "Clientes",
    description: "Lista de contatos e importação",
    routePrefixes: ["/admin/contatos", "/admin/etiquetas", "/admin/segmentos"],
  },
  {
    key: "templates",
    label: "Mensagens prontas",
    description: "Templates aprovados para envio",
    routePrefixes: ["/admin/templates"],
  },
  {
    key: "disparos",
    label: "Promoções",
    description: "Campanhas de disparo em massa",
    routePrefixes: ["/admin/disparos", "/admin/pesquisas"],
  },
  {
    key: "pages",
    label: "Páginas do site",
    description: "Listar páginas, editar textos e imagens no espelho, salvar rascunho, publicar e preview",
    routePrefixes: ["/admin/pages", "/admin/mirror", "/admin/preview"],
  },
  {
    key: "cardapio",
    label: "Cardápio",
    description: "Produtos, categorias, preços e imagens",
    routePrefixes: ["/admin/cardapio"],
  },
  {
    key: "header_footer",
    label: "Topo e rodapé",
    description: "Editar logo, menus de navegação, redes sociais e textos do rodapé",
    routePrefixes: ["/admin/header-footer"],
  },
  {
    key: "configuracoes",
    label: "Ajustes",
    description: "Horário WhatsApp e registros LGPD",
    routePrefixes: ["/admin/configuracoes", "/admin/conectar-whatsapp"],
  },
  {
    key: "usuarios",
    label: "Equipe",
    description: "Gerenciar usuários do painel (somente super admin ou quem já tem acesso)",
    routePrefixes: ["/admin/equipe"],
  },
];

/** Módulos listados no formulário de permissões (sem Equipe). */
export const ADMIN_ASSIGNABLE_MODULES = ADMIN_MODULES.filter(
  (module) => module.key !== "usuarios",
);

export function createEmptyPermissions(): AdminPermissionsMap {
  return ADMIN_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { view: false, edit: false, delete: false };
    return acc;
  }, {} as AdminPermissionsMap);
}

export function createFullPermissions(): AdminPermissionsMap {
  const permissions = ADMIN_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { view: true, edit: true, delete: true };
    return acc;
  }, {} as AdminPermissionsMap);
  permissions.usuarios = { view: false, edit: false, delete: false };
  return permissions;
}

export function normalizePermissions(raw: unknown): AdminPermissionsMap {
  const base = createEmptyPermissions();
  if (!raw || typeof raw !== "object") {
    return base;
  }
  for (const key of ADMIN_MODULE_KEYS) {
    const mod = (raw as Record<string, unknown>)[key];
    if (mod && typeof mod === "object") {
      const entry = mod as Record<string, unknown>;
      base[key] = {
        view: !!entry.view,
        edit: !!entry.edit,
        delete: !!entry.delete,
      };
    }
  }
  return base;
}

export function hasAdminPermission(
  permissions: AdminPermissionsMap | undefined,
  isSuperAdmin: boolean,
  module: AdminModuleKey,
  action: AdminPermissionAction,
): boolean {
  if (isSuperAdmin) {
    return true;
  }
  return !!permissions?.[module]?.[action];
}

export function canAccessAdminRoute(
  pathname: string,
  permissions: AdminPermissionsMap | undefined,
  isSuperAdmin: boolean,
): boolean {
  if (isSuperAdmin) {
    return true;
  }

  if (pathname.startsWith("/admin/equipe")) {
    return !!permissions?.usuarios?.edit;
  }

  const module = getModuleForRoute(pathname);
  if (!module) {
    return true;
  }
  return hasAdminPermission(permissions, isSuperAdmin, module, "view");
}

export function getModuleForRoute(pathname: string): AdminModuleKey | null {
  if (pathname.startsWith("/admin/preview/header-footer")) {
    return "header_footer";
  }

  const module = ADMIN_MODULES.find((m) =>
    m.routePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
  return module?.key ?? null;
}

export function getCmsEditModuleForRoute(pathname: string): "pages" | "header_footer" | null {
  if (pathname.startsWith("/admin/mirror/") || pathname.startsWith("/admin/preview/")) {
    if (pathname.includes("header-footer")) {
      return "header_footer";
    }
    return "pages";
  }
  if (pathname.startsWith("/admin/header-footer")) {
    return "header_footer";
  }
  return null;
}

export function canEditCmsRoute(
  pathname: string,
  permissions: AdminPermissionsMap | undefined,
  isSuperAdmin: boolean,
): boolean {
  const module = getCmsEditModuleForRoute(pathname);
  if (!module) {
    return false;
  }
  return hasAdminPermission(permissions, isSuperAdmin, module, "edit");
}
