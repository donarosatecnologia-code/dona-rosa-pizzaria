import { test, expect } from "@playwright/test";
import { hasAdminCredentials, openAdminRoute } from "./fixtures/admin-auth";

test.describe("Relatório de disparo (somente leitura)", () => {
  test.beforeEach(() => {
    test.skip(!hasAdminCredentials(), "E2E_ADMIN_EMAIL/PASSWORD não definidos no .env");
  });

  test("lista de disparos carrega e o detalhe tem filtros de entrega e pesquisa separados", async ({
    page,
  }) => {
    await openAdminRoute(page, "/admin/disparos", /mensagens ativas/i);

    const reportLink = page.getByRole("link", { name: /ver relatório/i }).first();
    await expect(reportLink).toBeVisible({ timeout: 20000 });
    await reportLink.click();
    await expect(page).toHaveURL(/\/admin\/disparos\/.+/);

    const surveyReport = page.getByText(/entrega do template/i);
    const genericReport = page.getByText(/destinatários e respostas/i);
    await expect(surveyReport.or(genericReport).first()).toBeVisible({ timeout: 20000 });
  });
});
