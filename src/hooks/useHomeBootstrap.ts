import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  HOME_CAROUSEL_KEYS,
  FOOTER_PAGE_CONTENT_KEYS,
  HOME_GALLERY_KEYS,
  HOME_IMAGE_SECTION_KEYS,
  HOME_PAGE_CONTENT_KEYS,
} from "@/config/home-bootstrap-keys";
import {
  fetchCarouselColumnsRow,
  fetchFooterCategories,
  fetchGalleryImages,
  fetchNavLinks,
  fetchPageContentImageRow,
  fetchPageContentsBatch,
  fetchSocialLinks,
} from "@/lib/cms-queryFns";
import { useCmsDisplayMode } from "@/contexts/CmsDisplayModeContext";

/**
 * Pré-carrega tudo o que a home precisa (shell + blocos + imagens + galerias + colunas de carrossel).
 * Mesmas queryKeys dos hooks — cache compartilhado quando os componentes montam.
 */
export function useHomeBootstrap() {
  const displayMode = useCmsDisplayMode();

  const homeKeysStr = useMemo(
    () => [...HOME_PAGE_CONTENT_KEYS].sort((a, b) => a.localeCompare(b)).join("|"),
    [],
  );
  const footerKeysStr = useMemo(
    () => [...FOOTER_PAGE_CONTENT_KEYS].sort((a, b) => a.localeCompare(b)).join("|"),
    [],
  );

  const queries = useQueries({
    queries: [
      { queryKey: ["nav-links"], queryFn: fetchNavLinks },
      { queryKey: ["social-links"], queryFn: fetchSocialLinks },
      { queryKey: ["footer-categories"], queryFn: fetchFooterCategories },
      {
        queryKey: ["page-contents-batch", "home", homeKeysStr, displayMode],
        queryFn: () => fetchPageContentsBatch("home", [...HOME_PAGE_CONTENT_KEYS] as string[]),
      },
      {
        queryKey: ["page-contents-batch", "footer", footerKeysStr, displayMode],
        queryFn: () => fetchPageContentsBatch("footer", [...FOOTER_PAGE_CONTENT_KEYS] as string[]),
      },
      ...HOME_IMAGE_SECTION_KEYS.map((sectionKey) => ({
        queryKey: ["page-contents", sectionKey, displayMode],
        queryFn: () => fetchPageContentImageRow(sectionKey),
      })),
      ...HOME_GALLERY_KEYS.map((sectionKey) => ({
        queryKey: ["gallery-images", sectionKey],
        queryFn: () => fetchGalleryImages(sectionKey),
      })),
      ...HOME_CAROUSEL_KEYS.map((sectionKey) => ({
        queryKey: ["page-contents", sectionKey, "carousel-columns", displayMode],
        queryFn: () => fetchCarouselColumnsRow(sectionKey),
      })),
    ],
  });

  const isPending = queries.some((q) => q.isPending);
  const isError = queries.some((q) => q.isError);

  return { isPending, isError };
}
