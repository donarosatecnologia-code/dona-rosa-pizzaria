import { test, expect } from "@playwright/test";
import { hasAdminCredentials, loginAsAdmin } from "./fixtures/admin-auth";
import { ADMIN_CMS_READONLY_ROUTES, WHATSAPP_ADMIN_ROUTES } from "./fixtures/cms-safety";

test.describe("Admin WhatsApp (somente leitura)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_EMAIL/PASSWORD não definidos no .env");
    await loginAsAdmin(page);
  });

  for (const route of WHATSAPP_ADMIN_ROUTES) {
    test(`${route.path} carrega`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
        timeout: 15000,
      });
    });
  }

  test("pesquisas — abre editor e cancela sem salvar", async ({ page }) => {
    await page.goto("/admin/pesquisas");
    await page.getByRole("button", { name: /nova pesquisa/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/monte as perguntas/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("contatos — histórico de importação compacto", async ({ page }) => {
    await page.goto("/admin/contatos");
    const history = page.getByText(/última importação|importar lista/i);
    await expect(history.first()).toBeVisible();
  });

  test("disparos — exige login (já autenticado)", async ({ page }) => {
    await page.goto("/admin/disparos");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /promoções/i })).toBeVisible();
  });
});

test.describe("Admin CMS (smoke sem edição)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_EMAIL/PASSWORD não definidos no .env");
    await loginAsAdmin(page);
  });

  for (const path of ADMIN_CMS_READONLY_ROUTES) {
    test(`${path} carrega — sem salvar/publicar`, async ({ page }) => {
      await page.goto(path);
      expect(page.url()).toContain(path.replace("/admin", "/admin"));

      const saveButtons = page.getByRole("button", { name: /^salvar$|^publicar$/i });
      const count = await saveButtons.count();
      if (count > 0) {
        await expect(saveButtons.first()).toBeVisible();
        // Deliberadamente não clicamos — conteúdo editorial intocado.
      }
    });
  }
});
