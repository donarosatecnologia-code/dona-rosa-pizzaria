import type { Page } from "@playwright/test";

export function hasAdminCredentials(): boolean {
  const email = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  return Boolean(email && password);
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Defina E2E_ADMIN_EMAIL/PASSWORD (ou ADMIN_EMAIL/PASSWORD) no .env para testes autenticados.",
    );
  }

  await page.goto("/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin\/(dashboard)?/, { timeout: 20000 });
}
