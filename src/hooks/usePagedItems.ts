import { useCallback, useEffect, useMemo, useState } from "react";

export const LIST_PAGE_SIZE = 20;

export function usePagedItems<T>(items: T[] | undefined, pageSize = LIST_PAGE_SIZE) {
  const [page, setPageRaw] = useState(0);
  const list = items ?? [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  // Stable identity — callers often reset page in useEffect([..., setPage]).
  const setPage = useCallback((next: number) => {
    setPageRaw((current) => {
      const clamped = Math.max(0, Math.floor(next));
      return clamped === current ? current : clamped;
    });
  }, []);

  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  useEffect(() => {
    const maxPage = Math.max(0, totalPages - 1);
    if (page > maxPage) {
      setPageRaw(maxPage);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => list.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [list, pageSize, safePage],
  );

  return {
    page: safePage,
    setPage,
    pageItems,
    totalPages,
    total,
    pageSize,
  };
}
