import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePagedItems } from "./usePagedItems";

describe("usePagedItems", () => {
  it("avança para a próxima página sem voltar para 0", () => {
    const items = Array.from({ length: 45 }, (_, index) => index);
    const { result } = renderHook(() => usePagedItems(items, 20));

    expect(result.current.page).toBe(0);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.pageItems).toEqual(items.slice(0, 20));

    act(() => {
      result.current.setPage(1);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toEqual(items.slice(20, 40));
  });
});
