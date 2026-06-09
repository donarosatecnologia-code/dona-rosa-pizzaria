import { test, expect } from "@playwright/test";

test.describe("Admin smoke (sem Meta)", () => {
  test("página de login carrega", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Painel administrativo" })).toBeVisible();
  });

  test("rota de disparos redireciona para login quando não autenticado", async ({ page }) => {
    await page.goto("/admin/disparos");
    await expect(page).toHaveURL(/login/);
  });
});
