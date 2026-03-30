import { useQueries } from "@tanstack/react-query";
import { fetchFooterCategories, fetchNavLinks, fetchSocialLinks } from "@/lib/cms-queryFns";

/**
 * Dados compartilhados por Header + Footer (nav, redes, categorias do rodapé).
 * Use em páginas públicas para manter o loading até o shell estar pronto.
 */
export function useSiteShellReady() {
  const results = useQueries({
    queries: [
      { queryKey: ["nav-links"], queryFn: fetchNavLinks },
      { queryKey: ["social-links"], queryFn: fetchSocialLinks },
      { queryKey: ["footer-categories"], queryFn: fetchFooterCategories },
    ],
  });

  return {
    isPending: results.some((r) => r.isPending),
    isError: results.some((r) => r.isError),
  };
}
