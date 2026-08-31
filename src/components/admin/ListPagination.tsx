import { Button } from "@/components/ui/button";
import { LIST_PAGE_SIZE } from "@/hooks/usePagedItems";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize = LIST_PAGE_SIZE,
  onPageChange,
  label = "registros",
}: ListPaginationProps) {
  if (total === 0) {
    return null;
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
        {total} {label} · página {page + 1} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="min-h-[44px] flex-1 sm:flex-none"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="min-h-[44px] flex-1 sm:flex-none"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
