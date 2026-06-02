import type { ComponentType } from "react";
import Index from "@/pages/Index";
import QuemSomosPage from "@/pages/QuemSomosPage";
import VenuePage from "@/pages/VenuePage";
import CoursesPage from "@/pages/CoursesPage";
import SustainabilityPage from "@/pages/SustainabilityPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfUsePage from "@/pages/TermsOfUsePage";
import DataDeletionPage from "@/pages/DataDeletionPage";

/** Slug da URL do admin → mesma página que o site público. */
export const ADMIN_PAGE_SLUGS = [
  "home",
  "quem-somos",
  "espacos",
  "cursos-e-eventos",
  "saude-e-sustentabilidade",
  "contato",
  "politica-privacidade",
  "termos-de-uso",
  "exclusao-de-dados",
] as const;

export type AdminPageSlug = (typeof ADMIN_PAGE_SLUGS)[number];

export const ADMIN_PAGE_COMPONENTS: Record<AdminPageSlug, ComponentType> = {
  home: Index,
  "quem-somos": QuemSomosPage,
  espacos: VenuePage,
  "cursos-e-eventos": CoursesPage,
  "saude-e-sustentabilidade": SustainabilityPage,
  contato: ContactPage,
  "politica-privacidade": PrivacyPolicyPage,
  "termos-de-uso": TermsOfUsePage,
  "exclusao-de-dados": DataDeletionPage,
};

export function isAdminPageSlug(value: string | undefined): value is AdminPageSlug {
  return !!value && value in ADMIN_PAGE_COMPONENTS;
}

export const ADMIN_PAGE_LABELS: Record<AdminPageSlug, string> = {
  home: "Home",
  "quem-somos": "Quem Somos",
  espacos: "Espaços",
  "cursos-e-eventos": "Cursos e Eventos",
  "saude-e-sustentabilidade": "Saúde e Sustentabilidade",
  contato: "Contato",
  "politica-privacidade": "Política de Privacidade",
  "termos-de-uso": "Termos de Uso",
  "exclusao-de-dados": "Exclusão de Dados",
};
