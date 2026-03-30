import { useQuery } from "@tanstack/react-query";
import {
  fetchCarouselColumnsRow,
  fetchGalleryImages,
  fetchPageContentImageRow,
} from "@/lib/cms-queryFns";
import { useCmsDisplayMode } from "@/contexts/CmsDisplayModeContext";

interface CmsMediaImage {
  src: string;
  alt: string;
}

/** Imagem CMS (publicada ou rascunho em modo preview). */
export function useCmsImage(sectionKey: string) {
  const displayMode = useCmsDisplayMode();

  const { data } = useQuery({
    queryKey: ["page-contents", sectionKey, displayMode],
    queryFn: () => fetchPageContentImageRow(sectionKey),
  });

  if (displayMode === "preview") {
    const d = (data?.image_url_draft ?? "").trim();
    if (d) {
      return d;
    }
  }
  return (data?.image_url ?? "").trim();
}

export function useCmsGallery(sectionKey: string) {
  const { data, isPending } = useQuery({
    queryKey: ["gallery-images", sectionKey],
    queryFn: () => fetchGalleryImages(sectionKey),
  });

  const images: CmsMediaImage[] =
    !data || data.length === 0
      ? []
      : data.map((image, idx) => ({
          src: image.image_url,
          alt: image.alt_text || `Imagem ${idx + 1}`,
        }));

  return { images, isPending };
}

function normalizeColumns(value: string | null | undefined, fallbackColumns: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (Number.isNaN(parsed)) {
    return fallbackColumns;
  }
  return Math.min(4, Math.max(1, parsed));
}

export function useCmsCarousel(sectionKey: string, fallbackColumns: number) {
  const displayMode = useCmsDisplayMode();
  const { images, isPending: galleryPending } = useCmsGallery(sectionKey);

  const { data, isPending: columnsPending } = useQuery({
    queryKey: ["page-contents", sectionKey, "carousel-columns", displayMode],
    queryFn: () => fetchCarouselColumnsRow(sectionKey),
  });

  const rawColumns =
    displayMode === "preview" && data?.content_draft?.trim()
      ? data.content_draft
      : data?.content;

  return {
    images,
    columns: normalizeColumns(rawColumns, fallbackColumns),
    isPending: galleryPending || columnsPending,
  };
}
