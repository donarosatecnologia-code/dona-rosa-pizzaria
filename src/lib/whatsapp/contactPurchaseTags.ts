/** Slugs de etiquetas automáticas baseadas em compras. */
export const PURCHASE_SYSTEM_TAG_SLUGS = [
  "cliente-ativo",
  "cliente-inativo",
  "cliente-frequente",
  "vip",
  "unica-compra",
] as const;

export type PurchaseSystemTagSlug = (typeof PURCHASE_SYSTEM_TAG_SLUGS)[number];

export interface PurchaseTagInput {
  purchaseCount: number | null;
  daysWithoutPurchase: number | null;
}

export function resolvePurchaseSystemTagSlugs(input: PurchaseTagInput): PurchaseSystemTagSlug[] {
  const tags: PurchaseSystemTagSlug[] = [];
  const count = input.purchaseCount;
  const days = input.daysWithoutPurchase;

  if (count === 1) {
    tags.push("unica-compra");
  }

  if (count != null && count > 50) {
    tags.push("cliente-frequente");
  }

  const isPurchaseActive = days != null && days >= 1 && days <= 99;
  const isPurchaseInactive = days != null && days > 100;

  if (isPurchaseInactive) {
    tags.push("cliente-inativo");
  }

  if (isPurchaseActive) {
    tags.push("cliente-ativo");
  }

  if (isPurchaseActive && count != null && count > 100) {
    tags.push("vip");
  }

  return tags;
}

export function isPurchaseSystemTagSlug(slug: string): slug is PurchaseSystemTagSlug {
  return (PURCHASE_SYSTEM_TAG_SLUGS as readonly string[]).includes(slug);
}
