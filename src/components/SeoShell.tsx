import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  buildBreadcrumbJsonLd,
  buildRestaurantJsonLd,
  buildWebSiteJsonLd,
  getCanonicalOrigin,
  getPageSeo,
} from "@/lib/siteSeo";

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

function setLinkRel(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * SEO por rota: título, meta, Open Graph, Twitter, JSON-LD e noindex no admin.
 */
export function SeoShell() {
  const { pathname } = useLocation();
  const origin = getCanonicalOrigin(import.meta.env.VITE_PUBLIC_SITE_URL);

  const isPrivate = pathname.startsWith("/admin") || pathname === "/login";
  const pageSeo = getPageSeo(pathname);
  const baseTitle = pathname.startsWith("/admin")
    ? `Admin | ${pageSeo.title.split(" | ").pop()}`
    : pageSeo.title;

  useEffect(() => {
    document.title = baseTitle;
    document.documentElement.lang = "pt-BR";

    if (origin && !isPrivate) {
      const pageUrl = `${origin}${pathname === "/" ? "" : pathname}`;
      setLinkRel("canonical", pageUrl);

      setMetaName("description", pageSeo.description);
      setMetaName("keywords", pageSeo.keywords.join(", "));
      setMetaName("author", "Janaina Guiotti");
      setMetaName("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
      setMetaName("googlebot", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
      setMetaName("ai:description", pageSeo.aiDescription);

      setMetaProperty("og:site_name", "Dona Rosa Pizzaria");
      setMetaProperty("og:locale", "pt_BR");
      setMetaProperty("og:type", pathname === "/" ? "website" : "article");
      setMetaProperty("og:url", pageUrl);
      setMetaProperty("og:title", baseTitle);
      setMetaProperty("og:description", pageSeo.description);
      setMetaProperty("og:image", `${origin}/favicon.png`);
      setMetaProperty("og:image:alt", "Dona Rosa Pizzaria — pizza artesanal em São Paulo");

      setMetaName("twitter:card", "summary_large_image");
      setMetaName("twitter:url", pageUrl);
      setMetaName("twitter:title", baseTitle);
      setMetaName("twitter:description", pageSeo.description);
      setMetaName("twitter:image", `${origin}/favicon.png`);

      setMetaName("geo.region", "BR-SP");
      setMetaName("geo.placename", "São Paulo");
    } else {
      const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      canonical?.removeAttribute("href");
      setMetaName("robots", "noindex, nofollow");
    }
  }, [pathname, origin, isPrivate, baseTitle, pageSeo]);

  const jsonLd = useMemo(() => {
    if (!origin || isPrivate) {
      return null;
    }
    const blocks: object[] = [
      buildWebSiteJsonLd(origin),
      buildRestaurantJsonLd(origin),
    ];
    const breadcrumb = buildBreadcrumbJsonLd(origin, pathname);
    if (breadcrumb) {
      blocks.push(breadcrumb);
    }
    return blocks;
  }, [origin, pathname, isPrivate]);

  if (!jsonLd) {
    return null;
  }

  return (
    <>
      {jsonLd.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
