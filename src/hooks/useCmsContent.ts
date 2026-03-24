import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CmsContentRecord {
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
}

export function useCmsContents(sectionKeys: string[], pageKey?: string) {
  const safeKeys = useMemo(() => Array.from(new Set(sectionKeys)), [sectionKeys]);

  const { data } = useQuery({
    queryKey: ["page-contents-batch", pageKey || "all", safeKeys.join("|")],
    queryFn: async () => {
      let query = supabase
        .from("page_contents")
        .select("section_key, title, content, image_url")
        .in("section_key", safeKeys);
      if (pageKey) {
        query = query.eq("page_key", pageKey);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as CmsContentRecord[];
    },
    enabled: safeKeys.length > 0,
  });

  const contentMap = useMemo(() => {
    const map = new Map<string, CmsContentRecord>();
    (data ?? []).forEach((item) => map.set(item.section_key, item));
    return map;
  }, [data]);

  function getText(sectionKey: string, fallback: string) {
    const item = contentMap.get(sectionKey);
    return item?.content || item?.title || fallback;
  }

  function getLink(sectionKey: string, fallbackLabel: string, fallbackUrl: string) {
    const item = contentMap.get(sectionKey);
    return {
      label: item?.title || fallbackLabel,
      url: item?.content || fallbackUrl,
    };
  }

  function getImage(sectionKey: string, fallbackUrl: string) {
    const item = contentMap.get(sectionKey);
    return item?.image_url || fallbackUrl;
  }

  return {
    getText,
    getLink,
    getImage,
  };
}
