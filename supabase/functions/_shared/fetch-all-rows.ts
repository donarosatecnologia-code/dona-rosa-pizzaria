export const POSTGREST_MAX_ROWS = 1000;

export async function fetchAllRows<T>(
  queryFn: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
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
