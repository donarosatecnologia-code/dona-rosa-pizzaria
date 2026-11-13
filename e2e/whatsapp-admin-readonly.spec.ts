import { test, expect } from "@playwright/test";
import { hasAdminCredentials, loginAsAdmin, openAdminRoute } from "./fixtures/admin-auth";
import { ADMIN_CMS_READONLY_ROUTES, WHATSAPP_ADMIN_ROUTES } from "./fixtures/cms-safety";

test.describe("Admin WhatsApp (somente leitura)", () => {
  test.beforeEach(() => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_EMAIL/PASSWORD não definidos no .env");
  });

  for (const route of WHATSAPP_ADMIN_ROUTES) {
    test(`${route.path} carrega`, async ({ page }) => {
      await openAdminRoute(page, route.path, route.heading);
    });
  }

  test("pesquisas — abre editor e cancela sem salvar", async ({ page }) => {
    await openAdminRoute(page, "/admin/pesquisas", /pesquisas/i);
    await page.getByRole("button", { name: /nova pesquisa/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/monte as perguntas/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("contatos — histórico de importação compacto", async ({ page }) => {
    await openAdminRoute(page, "/admin/contatos", /contatos/i);
    await expect(page.getByRole("button", { name: /importar lista/i })).toBeVisible();
    await expect(
      page.getByText(/última importação|nenhuma importação ainda/i),
    ).toBeVisible({ timeout: 15000 });
  });

  test("disparos — exige login (já autenticado)", async ({ page }) => {
    await openAdminRoute(page, "/admin/disparos", /mensagens ativas/i);
  });
});

test.describe("Admin CMS (smoke sem edição)", () => {
  test.beforeEach(() => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_EMAIL/PASSWORD não definidos no .env");
  });

  for (const path of ADMIN_CMS_READONLY_ROUTES) {
    test(`${path} carrega — sem salvar/publicar`, async ({ page }) => {
      await page.goto(path);
      if (page.url().includes("/login")) {
        await loginAsAdmin(page);
        await page.goto(path);
      }
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
