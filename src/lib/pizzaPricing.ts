/** Broto e mini são sempre percentuais exatos do preço da pizza grande (R$). */
export const PIZZA_BROTO_PERCENT_OF_GRANDE = 80;
export const PIZZA_MINI_PERCENT_OF_GRANDE = 65;

export type PizzaPricingMode = "percentage" | "fixed";

export interface PizzaSizePricingInput {
  grandePrice: number;
  isEnabled: boolean;
  pricingMode?: PizzaPricingMode | string | null;
  percentage?: number | null;
  fixedPrice?: number | null;
  defaultPercentOfGrande: number;
}

/**
 * Calcula broto ou mini a partir do preço da grande, em centavos inteiros, para bater com 80% / 65%.
 */
export function pizzaSizePriceFromGrande(
  grandePrice: number,
  percentOfGrande: number,
  isEnabled: boolean,
): number | null {
  if (!isEnabled) {
    return null;
  }
  if (!Number.isFinite(grandePrice) || grandePrice <= 0) {
    return null;
  }
  const grandeCents = Math.round(grandePrice * 100);
  const derivedCents = Math.round((grandeCents * percentOfGrande) / 100);
  return derivedCents / 100;
}

/**
 * Resolve preço de broto/mini respeitando configuração por produto (modo fixo ou percentual).
 * Mantém o comportamento padrão (80% / 65%) quando o produto usa os defaults do banco.
 */
export function resolvePizzaSizePrice(input: PizzaSizePricingInput): number | null {
  const { grandePrice, isEnabled, pricingMode, percentage, fixedPrice, defaultPercentOfGrande } = input;

  if (!isEnabled) {
    return null;
  }

  if (pricingMode === "fixed" && fixedPrice != null && Number.isFinite(fixedPrice)) {
    return fixedPrice;
  }

  const percent =
    pricingMode === "percentage" && percentage != null && Number.isFinite(percentage)
      ? percentage
      : defaultPercentOfGrande;

  return pizzaSizePriceFromGrande(grandePrice, percent, true);
}
