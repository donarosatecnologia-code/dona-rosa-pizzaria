import { describe, expect, it } from "vitest";
import { mapSpreadsheetRows, normalizeSpreadsheetHeader } from "./importContactsColumnMap";

describe("normalizeSpreadsheetHeader", () => {
  it("remove acentos e normaliza espaços", () => {
    expect(normalizeSpreadsheetHeader("  ÚLTIMA   COMPRA  ")).toBe("ultima compra");
  });
});

describe("mapSpreadsheetRows", () => {
  const headers = [
    "TELEFONE1",
    "NOME",
    "LOGR",
    "ENDERECO",
    "NUMERO",
    "COMPLEMENTO",
    "BAIRRO",
    "QTD TOTAL COMPRAS",
    "TOTAL R$ COMPRAS",
    "DATA CADASTRO",
    "ULTIMA COMPRA",
    "DIAS SEM COMPRAR ENTRE 27/03/26 E ULTIMA COMPRA",
  ];

  it("mapeia colunas da planilha de clientes", () => {
    const rows = mapSpreadsheetRows([
      headers,
      [
        "11999998888",
        "Maria Silva",
        "R.",
        "Das Flores",
        "100",
        "Apto 2",
        "Centro",
        "5",
        "R$ 250,00",
        "01/01/2024",
        "15/03/2026",
        "12",
      ],
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].phoneRaw).toBe("11999998888");
    expect(rows[0].name).toBe("Maria Silva");
    expect(rows[0].profile.full_address).toContain("R.");
    expect(rows[0].profile.full_address).toContain("Das Flores");
    expect(rows[0].profile.purchase_count).toBe("5");
    expect(rows[0].profile.days_without_purchase).toBe("12");
  });

  it("aceita cabeçalho telefone legado", () => {
    const rows = mapSpreadsheetRows([
      ["nome", "telefone"],
      ["João", "5511988887777"],
    ]);
    expect(rows[0].phoneRaw).toBe("5511988887777");
    expect(rows[0].name).toBe("João");
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
