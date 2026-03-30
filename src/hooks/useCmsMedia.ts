import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("image_url, image_url_draft, content, content_draft")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data;
    },
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
  const { data } = useQuery({
    queryKey: ["gallery-images", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("id, image_url, alt_text, sort_order")
        .eq("section_key", sectionKey)
        .eq("is_active", true)
        .order("sort_order");
      if (error) {
        throw error;
      }
      return data;
    },
  });

  if (!data || data.length === 0) {
    return [] as CmsMediaImage[];
  }

  return data.map((image, idx) => ({
    src: image.image_url,
    alt: image.alt_text || `Imagem ${idx + 1}`,
  }));
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
  const images = useCmsGallery(sectionKey);

  const { data } = useQuery({
    queryKey: ["page-contents", sectionKey, "carousel-columns", displayMode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("content, content_draft")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data;
    },
  });

  const rawColumns =
    displayMode === "preview" && data?.content_draft?.trim()
      ? data.content_draft
      : data?.content;

  return {
    images,
    columns: normalizeColumns(rawColumns, fallbackColumns),
  };
}
