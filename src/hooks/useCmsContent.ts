import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPageContentsBatch, type PageContentBatchRow } from "@/lib/cms-queryFns";
import { useCmsDisplayMode } from "@/contexts/CmsDisplayModeContext";

type CmsContentRecord = PageContentBatchRow;

/**
 * Conteúdo CMS. Modo `published` (padrão): site público.
 * Modo `preview`: admin / visualização de rascunho — prioriza *_draft quando preenchido.
 */
export function useCmsContents(sectionKeys: string[], pageKey?: string) {
  const displayMode = useCmsDisplayMode();
  const safeKeys = useMemo(
    () => Array.from(new Set(sectionKeys)).sort((a, b) => a.localeCompare(b)),
    [sectionKeys],
  );

  const { data, isPending, isError } = useQuery({
    queryKey: ["page-contents-batch", pageKey || "all", safeKeys.join("|"), displayMode],
    queryFn: () => fetchPageContentsBatch(pageKey, safeKeys),
    enabled: safeKeys.length > 0,
  });

  const contentMap = useMemo(() => {
    const map = new Map<string, CmsContentRecord>();
    (data ?? []).forEach((item) => map.set(item.section_key, item));
    return map;
  }, [data]);

  function getText(sectionKey: string): string {
    const item = contentMap.get(sectionKey);
    if (!item) {
      return "";
    }

    const published =
      item.content?.trim() || item.title?.trim() || item.subtitle?.trim() || "";
    const drafts = item.content_draft?.trim() || item.title_draft?.trim() || "";

    if (displayMode === "preview") {
      if (drafts) {
        return drafts;
      }
      return published;
    }

    if (published) {
      return published;
    }
    if (drafts) {
      return drafts;
    }
    return "";
  }

  function hasText(sectionKey: string): boolean {
    return getText(sectionKey).length > 0;
  }

  function getLink(sectionKey: string) {
    const item = contentMap.get(sectionKey);
    if (!item) {
      return { label: "", url: "" };
    }

    if (displayMode === "preview") {
      const label = (item.title_draft ?? item.title ?? "").trim();
      const url = (item.content_draft ?? item.content ?? "").trim();
      return { label, url };
    }

    const label = (item.title?.trim() || item.title_draft?.trim() || "");
    const url = (item.content?.trim() || item.content_draft?.trim() || "");
    return { label, url };
  }

  function getImage(sectionKey: string): string {
    const item = contentMap.get(sectionKey);
    if (!item) {
      return "";
    }

    if (displayMode === "preview") {
      const d = (item.image_url_draft ?? "").trim();
      if (d) {
        return d;
      }
    } else {
      const pub = (item.image_url ?? "").trim();
      if (pub) {
        return pub;
      }
      return (item.image_url_draft ?? "").trim();
    }

    return (item.image_url ?? "").trim();
  }

  return {
    getText,
    hasText,
    getLink,
    getImage,
    isPending,
    isError,
  };
}
