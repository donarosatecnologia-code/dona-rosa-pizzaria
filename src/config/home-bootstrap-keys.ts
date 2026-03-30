/**
 * Chaves usadas na home para pré-carregar antes de montar a página (evita placeholders).
 * Ordem não afeta a query (chaves são ordenadas no hook).
 */
export const HOME_PAGE_CONTENT_KEYS = [
  "home-quemsmos-title",
  "home-quemsmos-desc",
  "home-quemsmos-feat-0",
  "home-quemsmos-feat-1",
  "home-quemsmos-feat-2",
  "home-quemsmos-feat-3",
  "home-quemsmos-cta",
  "home-cardapio-title",
  "home-cardapio-desc",
  "home-cardapio-cta",
  "home-contato-title",
  "home-contato-subtitle",
  "home-contato-desc",
  "home-contato-cta-delivery",
  "home-contato-cta-reserva",
  "home-cursos-title",
  "home-cursos-desc",
  "home-cursos-cta",
  "home-saude-title",
  "home-saude-desc",
  "home-saude-cta",
  "home-fotos-title",
] as const;

export const FOOTER_PAGE_CONTENT_KEYS = [
  "footer-address",
  "footer-horario",
  "footer-contato",
  "footer-title-social",
  "footer-title-nav",
  "footer-title-cardapio",
  "footer-title-col4",
  "footer-col4-extra",
] as const;

/** Imagens por section_key (page_contents sem filtro de page_key no hook de imagem). */
export const HOME_IMAGE_SECTION_KEYS = [
  "header-logo",
  "home-hero-logo",
  "footer-logo",
  "home-saude-img",
  "home-contato-img",
] as const;

export const HOME_GALLERY_KEYS = ["home-fotos-gallery"] as const;

export const HOME_CAROUSEL_KEYS = ["home-cursos-carousel", "home-cardapio-carousel"] as const;
