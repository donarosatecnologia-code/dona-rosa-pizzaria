import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileStack,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Rows3,
  Send,
  Settings,
  Tag,
  UserCog,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Prefixo de rota para marcar item ativo */
  matchPrefix?: string;
}

export const ADMIN_BOTTOM_NAV: AdminNavItem[] = [
  { to: "/admin/conversas", label: "Mensagens", icon: MessageCircle, matchPrefix: "/admin/conversas" },
  { to: "/admin/dashboard", label: "Início", icon: LayoutDashboard, matchPrefix: "/admin/dashboard" },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed, matchPrefix: "/admin/cardapio" },
];

export const ADMIN_MORE_NAV: AdminNavItem[] = [
  { to: "/admin/contatos", label: "Clientes", icon: Users, matchPrefix: "/admin/contatos" },
  { to: "/admin/etiquetas", label: "Etiquetas", icon: Tag, matchPrefix: "/admin/etiquetas" },
  { to: "/admin/segmentos", label: "Segmentos", icon: Filter, matchPrefix: "/admin/segmentos" },
  { to: "/admin/pesquisas", label: "Pesquisas", icon: ClipboardList, matchPrefix: "/admin/pesquisas" },
  { to: "/admin/disparos", label: "Promoções", icon: Send, matchPrefix: "/admin/disparos" },
  { to: "/admin/templates", label: "Mensagens prontas", icon: FileText, matchPrefix: "/admin/templates" },
  { to: "/admin/pages", label: "Páginas do site", icon: FileStack, matchPrefix: "/admin/pages" },
  { to: "/admin/header-footer", label: "Topo e rodapé", icon: Rows3, matchPrefix: "/admin/header-footer" },
  { to: "/admin/equipe", label: "Equipe", icon: UserCog, matchPrefix: "/admin/equipe" },
  { to: "/admin/configuracoes", label: "Ajustes", icon: Settings, matchPrefix: "/admin/configuracoes" },
];

export const ADMIN_DESKTOP_NAV: AdminNavItem[] = [
  { to: "/admin/dashboard", label: "Início", icon: LayoutDashboard, matchPrefix: "/admin/dashboard" },
  { to: "/admin/conversas", label: "Mensagens", icon: MessageCircle, matchPrefix: "/admin/conversas" },
  { to: "/admin/contatos", label: "Clientes", icon: Users, matchPrefix: "/admin/contatos" },
  { to: "/admin/etiquetas", label: "Etiquetas", icon: Tag, matchPrefix: "/admin/etiquetas" },
  { to: "/admin/segmentos", label: "Segmentos", icon: Filter, matchPrefix: "/admin/segmentos" },
  { to: "/admin/pesquisas", label: "Pesquisas", icon: ClipboardList, matchPrefix: "/admin/pesquisas" },
  { to: "/admin/templates", label: "Mensagens prontas", icon: FileText, matchPrefix: "/admin/templates" },
  { to: "/admin/disparos", label: "Promoções", icon: Send, matchPrefix: "/admin/disparos" },
  { to: "/admin/pages", label: "Páginas do site", icon: FileStack, matchPrefix: "/admin/pages" },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed, matchPrefix: "/admin/cardapio" },
  { to: "/admin/header-footer", label: "Topo e rodapé", icon: Rows3, matchPrefix: "/admin/header-footer" },
  { to: "/admin/equipe", label: "Equipe", icon: UserCog, matchPrefix: "/admin/equipe" },
  { to: "/admin/configuracoes", label: "Ajustes", icon: Settings, matchPrefix: "/admin/configuracoes" },
];

export const ADMIN_SIGN_OUT = { label: "Sair", icon: LogOut };

export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  const prefix = item.matchPrefix ?? item.to;
  if (prefix === "/admin/dashboard") {
    return pathname === "/admin/dashboard" || pathname === "/admin";
  }
  if (prefix === "/admin/equipe") {
    return pathname === "/admin/equipe" || pathname.startsWith("/admin/equipe/");
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAdminChatRoute(pathname: string): boolean {
  return /^\/admin\/conversas\/[^/]+$/.test(pathname);
}

export function isAdminMirrorRoute(pathname: string): boolean {
  return pathname.startsWith("/admin/mirror/") || pathname.startsWith("/admin/header-footer");
}
