import { describe, expect, it } from "vitest";
import { resolvePurchaseSystemTagSlugs } from "./contactPurchaseTags";

describe("resolvePurchaseSystemTagSlugs", () => {
  it("marca cliente inativo com mais de 100 dias sem comprar", () => {
    expect(
      resolvePurchaseSystemTagSlugs({ purchaseCount: 10, daysWithoutPurchase: 101 }),
    ).toContain("cliente-inativo");
  });

  it("marca cliente ativo entre 1 e 99 dias", () => {
    expect(
      resolvePurchaseSystemTagSlugs({ purchaseCount: 10, daysWithoutPurchase: 30 }),
    ).toEqual(expect.arrayContaining(["cliente-ativo"]));
  });

  it("marca cliente frequente com mais de 50 compras", () => {
    expect(
      resolvePurchaseSystemTagSlugs({ purchaseCount: 51, daysWithoutPurchase: 200 }),
    ).toContain("cliente-frequente");
  });

  it("marca VIP apenas para ativo com mais de 100 compras", () => {
    expect(
      resolvePurchaseSystemTagSlugs({ purchaseCount: 120, daysWithoutPurchase: 15 }),
    ).toEqual(expect.arrayContaining(["cliente-ativo", "vip"]));

    expect(
      resolvePurchaseSystemTagSlugs({ purchaseCount: 120, daysWithoutPurchase: 150 }),
    ).not.toContain("vip");
  });

  it("marca única compra com exatamente 1 compra", () => {
    expect(
      resolvePurchaseSystemTagSlugs({ purchaseCount: 1, daysWithoutPurchase: 10 }),
    ).toContain("unica-compra");
  });

  it("não marca ativo nem inativo sem data de última compra", () => {
    expect(resolvePurchaseSystemTagSlugs({ purchaseCount: 5, daysWithoutPurchase: null })).toEqual(
      [],
    );
  });
});
