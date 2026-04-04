import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BrandAlecrim, BrandTomilho, BrandTomilhoB, BrandTrigo } from "@/components/BrandAccents";

/**
 * Efeitos só para o site público (fora de /admin e /login):
 * - classe no body para alinhar textos centralizados à esquerda no mobile (ver index.css)
 * - camada fixa com elementos de marca visíveis em telas < lg, cores originais, sem opacidade
 */
export function SitePublicChrome() {
  const { pathname } = useLocation();
  const isPublicSite = !pathname.startsWith("/admin") && pathname !== "/login";

  useEffect(() => {
    document.body.classList.toggle("site-public", isPublicSite);
    return () => {
      document.body.classList.remove("site-public");
    };
  }, [isPublicSite]);

  if (!isPublicSite) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden lg:hidden"
      aria-hidden
    >
      <BrandAlecrim className="absolute -left-1 top-24 h-[7.5rem] w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
      <BrandTrigo className="absolute -right-2 top-[38%] h-24 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
      <BrandTomilho className="absolute bottom-36 left-1 h-[5.5rem] w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
      <BrandTomilhoB className="absolute bottom-24 right-0 h-20 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
    </div>
  );
}
