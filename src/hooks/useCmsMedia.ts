import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CmsMediaImage {
  src: string;
  alt: string;
}

export function useCmsImage(sectionKey: string, fallbackSrc: string) {
  const { data } = useQuery({
    queryKey: ["page-contents", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("image_url")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return data?.image_url || fallbackSrc;
}

export function useCmsGallery(sectionKey: string, fallbackImages: CmsMediaImage[]) {
  const { data } = useQuery({
    queryKey: ["gallery-images", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("id, image_url, alt_text, sort_order")
        .eq("section_key", sectionKey)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (!data || data.length === 0) {
    return fallbackImages;
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

export function useCmsCarousel(sectionKey: string, fallbackImages: CmsMediaImage[], fallbackColumns: number) {
  const images = useCmsGallery(sectionKey, fallbackImages);

  const { data } = useQuery({
    queryKey: ["page-contents", sectionKey, "carousel-columns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("content")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return {
    images,
    columns: normalizeColumns(data?.content, fallbackColumns),
  };
}
