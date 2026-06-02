import { describe, expect, it } from "vitest";
import {
  PIZZA_BROTO_PERCENT_OF_GRANDE,
  PIZZA_MINI_PERCENT_OF_GRANDE,
  pizzaSizePriceFromGrande,
  resolvePizzaSizePrice,
} from "@/lib/pizzaPricing";

describe("pizzaSizePriceFromGrande", () => {
  it("calcula 80% do preço grande para broto", () => {
    expect(pizzaSizePriceFromGrande(100, PIZZA_BROTO_PERCENT_OF_GRANDE, true)).toBe(80);
  });

  it("calcula 65% do preço grande para mini", () => {
    expect(pizzaSizePriceFromGrande(100, PIZZA_MINI_PERCENT_OF_GRANDE, true)).toBe(65);
  });

  it("retorna null quando tamanho desabilitado", () => {
    expect(pizzaSizePriceFromGrande(100, 80, false)).toBeNull();
  });

  it("arredonda em centavos inteiros", () => {
    expect(pizzaSizePriceFromGrande(49.9, 80, true)).toBe(39.92);
  });
});

describe("resolvePizzaSizePrice", () => {
  it("usa percentual padrão quando modo percentage com default do banco", () => {
    expect(
      resolvePizzaSizePrice({
        grandePrice: 100,
        isEnabled: true,
        pricingMode: "percentage",
        percentage: 80,
        fixedPrice: null,
        defaultPercentOfGrande: PIZZA_BROTO_PERCENT_OF_GRANDE,
      }),
    ).toBe(80);
  });

  it("usa percentual customizado por produto", () => {
    expect(
      resolvePizzaSizePrice({
        grandePrice: 100,
        isEnabled: true,
        pricingMode: "percentage",
        percentage: 75,
        fixedPrice: null,
        defaultPercentOfGrande: PIZZA_BROTO_PERCENT_OF_GRANDE,
      }),
    ).toBe(75);
  });

  it("usa preço fixo quando modo fixed", () => {
    expect(
      resolvePizzaSizePrice({
        grandePrice: 100,
        isEnabled: true,
        pricingMode: "fixed",
        percentage: null,
        fixedPrice: 42.5,
        defaultPercentOfGrande: PIZZA_BROTO_PERCENT_OF_GRANDE,
      }),
    ).toBe(42.5);
  });

  it("mantém fallback 80/65 quando pricingMode não informado", () => {
    expect(
      resolvePizzaSizePrice({
        grandePrice: 100,
        isEnabled: true,
        pricingMode: null,
        percentage: null,
        fixedPrice: null,
        defaultPercentOfGrande: PIZZA_BROTO_PERCENT_OF_GRANDE,
      }),
    ).toBe(80);
  });
});
