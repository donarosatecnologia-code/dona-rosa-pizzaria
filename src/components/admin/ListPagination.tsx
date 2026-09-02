import { Button } from "@/components/ui/button";
import { LIST_PAGE_SIZE } from "@/hooks/usePagedItems";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  label?: string;
  isFetching?: boolean;
}

function clampPage(page: number, totalPages: number): number {
  const maxPage = Math.max(0, totalPages - 1);
  return Math.max(0, Math.min(page, maxPage));
}

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize = LIST_PAGE_SIZE,
  onPageChange,
  label = "registros",
  isFetching = false,
}: ListPaginationProps) {
  if (total === 0) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const currentPage = clampPage(page, safeTotalPages);
  const atFirst = currentPage <= 0;
  const atLast = currentPage >= safeTotalPages - 1;

  function goTo(nextPage: number) {
    onPageChange(clampPage(nextPage, safeTotalPages));
  }

  if (total <= pageSize) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        {total} {label}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between max-md:pb-1">
      <p className="text-muted-foreground">
        {total} {label}
        <span className="mx-1.5 text-border">·</span>
        Página <span className="font-medium text-foreground">{currentPage + 1}</span> de{" "}
        <span className="font-medium text-foreground">{safeTotalPages}</span>
        {isFetching && <span className="ml-2 text-xs">Carregando…</span>}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="min-h-[44px] flex-1 sm:flex-none"
          disabled={atFirst || isFetching}
          onClick={() => goTo(currentPage - 1)}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="min-h-[44px] flex-1 sm:flex-none"
          disabled={atLast || isFetching}
          onClick={() => goTo(currentPage + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
