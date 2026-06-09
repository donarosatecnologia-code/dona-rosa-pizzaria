import { test, expect } from "@playwright/test";
import { CMS_READONLY_ROUTES } from "./fixtures/cms-safety";

/**
 * Site público — somente leitura.
 * Não preenche formulários nem dispara ações que alterem CMS.
 */
test.describe("Site público (somente leitura — CMS intocado)", () => {
  for (const path of CMS_READONLY_ROUTES) {
    test(`${path} carrega sem erro fatal`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(500);

      await expect(page.locator("body")).not.toContainText(
        "Não foi possível carregar o conteúdo",
      );
    });
  }

  test("home exibe estrutura principal", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("footer").first()).toBeVisible({ timeout: 15000 });
  });

  test("cardápio público lista categorias ou produtos", async ({ page }) => {
    await page.goto("/cardapio");
    await page.waitForLoadState("networkidle");

    const hasMenuContent = await page
      .getByText(/pizza|cardápio|R\$/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasMenuContent).toBe(true);
  });

  test("admin e login com noindex", async ({ page }) => {
    await page.goto("/login");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toMatch(/noindex/i);
  });
});
