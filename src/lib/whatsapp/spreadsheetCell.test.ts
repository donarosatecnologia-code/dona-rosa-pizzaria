import { describe, expect, it } from "vitest";
import { spreadsheetCellToString } from "./spreadsheetCell";

describe("spreadsheetCellToString", () => {
  it("converte número inteiro do excel sem notação científica", () => {
    expect(spreadsheetCellToString(5511999998888)).toBe("5511999998888");
  });

  it("expande notação científica com vírgula decimal brasileira", () => {
    const expanded = spreadsheetCellToString("9,1999999888E+09");
    expect(expanded).not.toContain("E");
    expect(expanded.replace(/\D/g, "").length).toBeGreaterThanOrEqual(10);
  });
});
