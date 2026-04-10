/** Broto e mini são sempre percentuais exatos do preço da pizza grande (R$). */
export const PIZZA_BROTO_PERCENT_OF_GRANDE = 80;
export const PIZZA_MINI_PERCENT_OF_GRANDE = 65;

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
