import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "Dona Rosa Pizzaria";

const PAGE_TITLES: Record<string, string> = {
  "/": `${SITE_NAME} | Pizza artesanal em São Paulo`,
  "/quem-somos": `Quem somos | ${SITE_NAME}`,
  "/cardapio": `Cardápio | ${SITE_NAME}`,
  "/espacos": `Espaços e eventos | ${SITE_NAME}`,
  "/cursos-e-eventos": `Cursos e eventos | ${SITE_NAME}`,
  "/saude-e-sustentabilidade": `Saúde e sustentabilidade | ${SITE_NAME}`,
  "/contato": `Contato | ${SITE_NAME}`,
  "/politica-de-privacidade": `Política de privacidade | ${SITE_NAME}`,
  "/termos-de-uso": `Termos de uso | ${SITE_NAME}`,
  "/login": `Login | ${SITE_NAME}`,
};

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function getOrigin(): string {
  const env = import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) {
    return env;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/**
 * Títulos por rota, JSON-LD (Restaurante), link canônico e noindex na área admin.
 */
export function SeoShell() {
  const { pathname } = useLocation();
  const origin = getOrigin();

  useEffect(() => {
    const isPrivate = pathname.startsWith("/admin") || pathname === "/login";
    const baseTitle = pathname.startsWith("/admin")
      ? `Admin | ${SITE_NAME}`
      : PAGE_TITLES[pathname] ?? `Página não encontrada | ${SITE_NAME}`;
    document.title = baseTitle;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    if (origin && !pathname.startsWith("/admin")) {
      canonical.href = `${origin}${pathname === "/" ? "" : pathname}`;
    } else {
      canonical.removeAttribute("href");
    }

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = isPrivate ? "noindex, nofollow" : "index, follow";

    const desc =
      "Pizza artesanal com massa leve e ingredientes locais sustentáveis em São Paulo. Cardápio, espaços para eventos e delivery.";
    const ogImage = origin ? `${origin}/favicon.png` : "";

    if (origin && !isPrivate) {
      const pageUrl = `${origin}${pathname === "/" ? "" : pathname}`;
      setMetaProperty("og:url", pageUrl);
      setMetaProperty("og:title", baseTitle);
      setMetaProperty("og:description", desc);
      if (ogImage) {
        setMetaProperty("og:image", ogImage);
      }
      setMetaName("twitter:url", pageUrl);
      setMetaName("twitter:title", baseTitle);
      setMetaName("twitter:description", desc);
      if (ogImage) {
        setMetaName("twitter:image", ogImage);
      }
    }
  }, [pathname, origin]);

  const jsonLd = useMemo(() => {
    if (!origin || pathname.startsWith("/admin") || pathname === "/login") {
      return null;
    }
    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": `${origin}/#restaurant`,
      name: SITE_NAME,
      url: origin,
      description:
        "Pizza artesanal com massa leve e ingredientes locais. Ambiente acolhedor em São Paulo.",
      servesCuisine: "Italian",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Rua Caminha de Amorim, 242",
        addressLocality: "São Paulo",
        addressRegion: "SP",
        postalCode: "05451-020",
        addressCountry: "BR",
      },
      potentialAction: {
        "@type": "ReserveAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${origin}/contato`,
        },
      },
    };
  }, [origin, pathname]);

  if (!jsonLd) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
