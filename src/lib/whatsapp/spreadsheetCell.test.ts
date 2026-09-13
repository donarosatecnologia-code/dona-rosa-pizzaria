import { describe, expect, it } from "vitest";
import { spreadsheetCellToString, xlsxCellToString } from "./spreadsheetCell";

describe("xlsxCellToString", () => {
  it("usa cell.v para números (ignora cell.w em notação científica)", () => {
    expect(
      xlsxCellToString({ t: "n", v: 551138621077, w: "5.51139E+11" }),
    ).toBe("551138621077");
    expect(
      xlsxCellToString({ t: "n", v: 551123370523, w: "5.51123E+11" }),
    ).toBe("551123370523");
    expect(
      xlsxCellToString({ t: "n", v: 5511763131424, w: "5.51176E+12" }),
    ).toBe("5511763131424");
  });

  it("converte serial Excel de data para ISO", () => {
    expect(
      xlsxCellToString({ t: "n", v: 46273, w: "08/09/26", z: "dd/mm/yy" }),
    ).toBe("2026-09-08");
  });

  it("converte célula Date para ISO", () => {
    expect(
      xlsxCellToString({ t: "d", v: new Date(Date.UTC(2026, 8, 8)) }),
    ).toBe("2026-09-08");
  });

  it("mantém texto formatado em células string", () => {
    expect(xlsxCellToString({ t: "s", v: "55119882704", w: "55119882704" })).toBe(
      "55119882704",
    );
  });
});

describe("spreadsheetCellToString", () => {
  it("converte número inteiro diretamente", () => {
    expect(spreadsheetCellToString(551138621077)).toBe("551138621077");
  });
});
