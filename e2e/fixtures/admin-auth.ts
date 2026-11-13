import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

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

  await page.goto("/admin/dashboard");
  if (!page.url().includes("/login")) {
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible({ timeout: 20000 });
    return;
  }

  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 25000 });
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible({ timeout: 20000 });
}

export async function openAdminRoute(
  page: Page,
  path: string,
  heading: string | RegExp,
): Promise<void> {
  await page.goto(path);
  if (page.url().includes("/login")) {
    await loginAsAdmin(page);
    await page.goto(path);
  }
  await expect(page).not.toHaveURL(/login/);
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible({
    timeout: 20000,
  });
}
