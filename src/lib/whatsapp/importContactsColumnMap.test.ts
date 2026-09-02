import { describe, expect, it } from "vitest";
import { mapSpreadsheetRows, normalizeSpreadsheetHeader } from "./importContactsColumnMap";

describe("normalizeSpreadsheetHeader", () => {
  it("remove acentos e normaliza barras", () => {
    expect(normalizeSpreadsheetHeader("TOTAL/COMPRAS")).toBe("total compras");
    expect(normalizeSpreadsheetHeader("DATA/CADASTRO")).toBe("data cadastro");
    expect(normalizeSpreadsheetHeader("ULTIMA/COMPRA")).toBe("ultima compra");
    expect(normalizeSpreadsheetHeader("R$/COMPRAS")).toBe("r$ compras");
  });
});

describe("mapSpreadsheetRows", () => {
  const headers = [
    "TELEFONE",
    "NOME",
    "LOGR",
    "ENDERECO",
    "NUMERO",
    "COMPLEMENTO",
    "BAIRRO",
    "TOTAL/COMPRAS",
    "R$/COMPRAS",
    "DATA/CADASTRO",
    "ULTIMA/COMPRA",
    "DIAS SEM COMPRAR/DESDE_ÚLTIMA_COMPRA/ATÉ/27-03-26",
  ];

  it("mapeia colunas da planilha Dona Rosa", () => {
    const rows = mapSpreadsheetRows([
      headers,
      [
        "5511999998888",
        "Maria Silva",
        "R.",
        "Das Flores",
        "100",
        "Apto 2",
        "Centro",
        "5",
        "235.5",
        "31.07.2024 19:36",
        "15.03.2026 19:28",
        "604",
      ],
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].phoneRaw).toBe("5511999998888");
    expect(rows[0].name).toBe("Maria Silva");
    expect(rows[0].crm.addressStreet).toBe("R. Das Flores");
    expect(rows[0].crm.addressNumber).toBe("100");
    expect(rows[0].crm.purchaseCount).toBe(5);
    expect(rows[0].crm.purchaseTotal).toBe(235.5);
    expect(rows[0].crm.registeredAt).toBe("2024-07-31");
    expect(rows[0].crm.lastPurchaseAt).toBe("2026-03-15");
  });

  it("aceita cabeçalho TELEFONE da planilha Dona Rosa", () => {
    const rows = mapSpreadsheetRows([
      ["TELEFONE", "NOME"],
      ["551138621077", "Cliente Fixo"],
    ]);
    expect(rows[0].phoneRaw).toBe("551138621077");
  });

  it("falha sem coluna de telefone", () => {
    expect(() =>
      mapSpreadsheetRows([
        ["NOME", "BAIRRO"],
        ["Ana", "Centro"],
      ]),
    ).toThrow("missing_phone_column");
  });
});
