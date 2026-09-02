import { describe, expect, it } from "vitest";
import { getDaysWithoutPurchase } from "./contactCrm";
import {
  parseSpreadsheetDateString,
  parseSpreadsheetInteger,
  parseSpreadsheetMoney,
} from "./parseSpreadsheetDate";

describe("parseSpreadsheetDateString", () => {
  it("parseia dd.mm.yyyy com hora", () => {
    expect(parseSpreadsheetDateString("31.07.2024 19:36")).toBe("2024-07-31");
  });

  it("parseia dd/mm/yyyy", () => {
    expect(parseSpreadsheetDateString("15/03/2026")).toBe("2026-03-15");
  });
});

describe("parseSpreadsheetInteger", () => {
  it("extrai inteiro de texto", () => {
    expect(parseSpreadsheetInteger("119")).toBe(119);
  });
});

describe("parseSpreadsheetMoney", () => {
  it("parseia valor com R$", () => {
    expect(parseSpreadsheetMoney(" R$ 235.50 ")).toBe(235.5);
    expect(parseSpreadsheetMoney(" R$ 1,418.00 ")).toBe(1418);
  });
});

describe("getDaysWithoutPurchase", () => {
  it("calcula dias desde a última compra", () => {
    const today = new Date();
    const threeDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3);
    const iso = threeDaysAgo.toISOString().slice(0, 10);
    expect(getDaysWithoutPurchase(iso)).toBe(3);
  });

  it("retorna null sem data", () => {
    expect(getDaysWithoutPurchase(null)).toBeNull();
  });
});
