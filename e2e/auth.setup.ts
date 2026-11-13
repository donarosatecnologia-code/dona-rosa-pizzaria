import { test as setup } from "@playwright/test";
import { hasAdminCredentials, loginAsAdmin } from "./fixtures/admin-auth";

setup("autenticar admin", async ({ page }) => {
  setup.skip(!hasAdminCredentials(), "E2E_ADMIN_EMAIL/PASSWORD não definidos no .env");
  await loginAsAdmin(page);
  await page.context().storageState({ path: "e2e/.auth/admin.json" });
});
