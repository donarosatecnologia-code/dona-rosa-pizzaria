import { SITE_BUSINESS } from "@/lib/siteConfig";

export interface PageSeoMeta {
  title: string;
  description: string;
  keywords: string[];
  aiDescription: string;
}

const SITE_NAME = SITE_BUSINESS.name;

export const DEFAULT_SEO: PageSeoMeta = {
  title: `${SITE_NAME} | Pizza artesanal em São Paulo`,
  description:
    "Pizza artesanal com massa leve e farinha integral na Vila Madalena, São Paulo. Cardápio completo, delivery, eventos, cursos de pizza e ambiente acolhedor para a família.",
  keywords: [
    "pizzaria São Paulo",
    "pizza artesanal",
    "pizza Vila Madalena",
    "Dona Rosa Pizzaria",
    "pizza massa integral",
    "delivery pizza SP",
  ],
  aiDescription:
    "Dona Rosa Pizzaria em São Paulo (Vila Madalena): pizza artesanal, massa integral, cardápio online, delivery, reservas, cursos e eventos.",
};

export const PAGE_SEO: Record<string, PageSeoMeta> = {
  "/": DEFAULT_SEO,
  "/quem-somos": {
    title: `Quem somos | ${SITE_NAME}`,
    description:
      "Conheça a história da Dona Rosa Pizzaria: tradição, ingredientes locais, massa artesanal e um espaço acolhedor na Vila Madalena em São Paulo.",
    keywords: ["história Dona Rosa", "pizzaria artesanal SP", "pizza de qualidade"],
    aiDescription: "Página sobre a Dona Rosa Pizzaria: origem, valores, ingredientes e proposta gastronômica em São Paulo.",
  },
  "/cardapio": {
    title: `Cardápio | ${SITE_NAME}`,
    description:
      "Veja o cardápio completo da Dona Rosa: pizzas especiais, massa integral, vinhos e opções para toda a família. Peça pelo WhatsApp ou visite nossa unidade.",
    keywords: ["cardápio pizza", "pizzas São Paulo", "menu Dona Rosa"],
    aiDescription: "Cardápio online da Dona Rosa Pizzaria com pizzas, preços e categorias.",
  },
  "/espacos": {
    title: `Espaços e eventos | ${SITE_NAME}`,
    description:
      "Espaços para eventos, confraternizações e celebrações na Dona Rosa Pizzaria em São Paulo. Ambiente acolhedor para grupos e ocasiões especiais.",
    keywords: ["eventos pizzaria", "espaço para festas SP", "confraternização pizza"],
    aiDescription: "Informações sobre espaços e eventos na Dona Rosa Pizzaria.",
  },
  "/cursos-e-eventos": {
    title: `Cursos e eventos | ${SITE_NAME}`,
    description:
      "Cursos de pizza e experiências gastronômicas na Dona Rosa. Aprenda técnicas artesanais com massa leve e ingredientes selecionados.",
    keywords: ["curso de pizza", "workshop pizza São Paulo"],
    aiDescription: "Cursos e experiências de pizza oferecidos pela Dona Rosa Pizzaria.",
  },
  "/saude-e-sustentabilidade": {
    title: `Saúde e sustentabilidade | ${SITE_NAME}`,
    description:
      "Compromisso da Dona Rosa com ingredientes locais, farinha integral e práticas sustentáveis na produção de pizzas artesanais.",
    keywords: ["pizza saudável", "sustentabilidade gastronomia", "farinha integral"],
    aiDescription: "Práticas de saúde e sustentabilidade da Dona Rosa Pizzaria.",
  },
  "/contato": {
    title: `Contato | ${SITE_NAME}`,
    description:
      "Fale com a Dona Rosa Pizzaria: endereço na Vila Madalena, telefone, WhatsApp e horário de funcionamento. Reservas e pedidos.",
    keywords: ["contato pizzaria SP", "WhatsApp Dona Rosa", "endereço Vila Madalena"],
    aiDescription: "Contato, endereço, telefone e WhatsApp da Dona Rosa Pizzaria em São Paulo.",
  },
  "/politica-de-privacidade": {
    title: `Política de privacidade | ${SITE_NAME}`,
    description: "Política de privacidade e tratamento de dados da Dona Rosa Pizzaria.",
    keywords: ["política de privacidade"],
    aiDescription: "Política de privacidade do site da Dona Rosa Pizzaria.",
  },
  "/termos-de-uso": {
    title: `Termos de uso | ${SITE_NAME}`,
    description: "Termos de uso do site institucional da Dona Rosa Pizzaria.",
    keywords: ["termos de uso"],
    aiDescription: "Termos de uso do site da Dona Rosa Pizzaria.",
  },
  "/login": {
    title: `Login | ${SITE_NAME}`,
    description: "Acesso ao painel administrativo da Dona Rosa Pizzaria.",
    keywords: [],
    aiDescription: "Login do painel administrativo Dona Rosa.",
  },
  "/recuperar-senha": {
    title: `Recuperar senha | ${SITE_NAME}`,
    description: "Recupere o acesso ao painel administrativo da Dona Rosa Pizzaria.",
    keywords: [],
    aiDescription: "Recuperação de senha do painel Dona Rosa.",
  },
  "/redefinir-senha": {
    title: `Redefinir senha | ${SITE_NAME}`,
    description: "Defina uma nova senha para o painel administrativo da Dona Rosa Pizzaria.",
    keywords: [],
    aiDescription: "Redefinição de senha do painel Dona Rosa.",
  },
};

export function getPageSeo(pathname: string): PageSeoMeta {
  return PAGE_SEO[pathname] ?? {
    title: `Página não encontrada | ${SITE_NAME}`,
    description: DEFAULT_SEO.description,
    keywords: DEFAULT_SEO.keywords,
    aiDescription: DEFAULT_SEO.aiDescription,
  };
}

export function getCanonicalOrigin(envUrl?: string): string {
  const env = envUrl?.replace(/\/$/, "");
  if (env) {
    return env;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return SITE_BUSINESS.url;
}

export function buildBreadcrumbJsonLd(origin: string, pathname: string): object | null {
  if (pathname === "/" || pathname.startsWith("/admin")) {
    return null;
  }
  const seo = getPageSeo(pathname);
  const segments = pathname.split("/").filter(Boolean);
  const items = [
    { "@type": "ListItem", position: 1, name: "Início", item: origin },
  ];
  let acc = origin;
  segments.forEach((seg, index) => {
    acc = `${acc}/${seg}`;
    items.push({
      "@type": "ListItem",
      position: index + 2,
      name: index === segments.length - 1 ? seo.title.split(" | ")[0] : seg,
      item: acc,
    });
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

export function buildRestaurantJsonLd(origin: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${origin}/#restaurant`,
    name: SITE_BUSINESS.name,
    url: origin,
    image: `${origin}/favicon.png`,
    logo: `${origin}/favicon.png`,
    description: DEFAULT_SEO.description,
    servesCuisine: SITE_BUSINESS.cuisine,
    priceRange: SITE_BUSINESS.priceRange,
    telephone: `+${SITE_BUSINESS.phoneE164}`,
    email: SITE_BUSINESS.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_BUSINESS.address.street,
      addressLocality: SITE_BUSINESS.address.city,
      addressRegion: SITE_BUSINESS.address.state,
      postalCode: SITE_BUSINESS.address.postalCode,
      addressCountry: SITE_BUSINESS.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_BUSINESS.geo.latitude,
      longitude: SITE_BUSINESS.geo.longitude,
    },
    openingHoursSpecification: SITE_BUSINESS.openingHours.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: slot.days,
      opens: slot.opens,
      closes: slot.closes,
    })),
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://wa.me/${SITE_BUSINESS.phoneE164}`,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
    },
  };
}

export function buildWebSiteJsonLd(origin: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: SITE_BUSINESS.name,
    url: origin,
    inLanguage: SITE_BUSINESS.language,
    publisher: { "@id": `${origin}/#restaurant` },
  };
}
