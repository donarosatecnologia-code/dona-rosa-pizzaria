/** PostgREST / Supabase devolve no máximo 1000 linhas por request (max-rows). */
export const POSTGREST_MAX_ROWS = 1000;

export interface PageQueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/**
 * Percorre um select/rpc com `.range()` até esgotar as linhas,
 * evitando o corte silencioso em 1000 registros.
 */
export async function fetchAllRows<T>(
  queryFn: (from: number, to: number) => PromiseLike<PageQueryResult<T>>,
  pageSize = POSTGREST_MAX_ROWS,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFn(from, to);
    if (error) {
      throw error;
    }
    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return all;
}
