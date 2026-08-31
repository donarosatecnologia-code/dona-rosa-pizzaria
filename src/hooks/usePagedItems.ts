import { useEffect, useMemo, useState } from "react";

export const LIST_PAGE_SIZE = 20;

export function usePagedItems<T>(items: T[] | undefined, pageSize = LIST_PAGE_SIZE) {
  const [page, setPage] = useState(0);
  const list = items ?? [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

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
