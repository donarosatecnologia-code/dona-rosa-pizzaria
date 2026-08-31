import { describe, expect, it, vi } from "vitest";
import { fetchAllRows, POSTGREST_MAX_ROWS } from "./fetchAllRows";

describe("fetchAllRows", () => {
  it("concatena páginas até a última incompleta", async () => {
    const page1 = Array.from({ length: POSTGREST_MAX_ROWS }, (_, i) => i);
    const page2 = [POSTGREST_MAX_ROWS, POSTGREST_MAX_ROWS + 1];
    const queryFn = vi.fn(async (from: number) => {
      if (from === 0) {
        return { data: page1, error: null };
      }
      return { data: page2, error: null };
    });

    const result = await fetchAllRows(queryFn);

    expect(result).toHaveLength(POSTGREST_MAX_ROWS + 2);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("propaga erro da query", async () => {
    await expect(
      fetchAllRows(async () => ({ data: null, error: { message: "boom" } })),
    ).rejects.toMatchObject({ message: "boom" });
  });
});
