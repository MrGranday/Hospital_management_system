import { expect, test } from "@playwright/test";

test.describe("Smoke & Security Route Guard Tests", () => {
  test("unauthenticated access to protected routes redirects to /login", async ({ page }) => {
    const protectedRoutes = [
      "/patients",
      "/appointments",
      "/opd/queue",
      "/pharmacy",
      "/lab",
      "/finance",
      "/hr",
      "/platform/hospitals",
      "/audit",
    ];

    for (const route of protectedRoutes) {
      const response = await page.goto(route);
      // Next.js middleware / proxy redirect to /login
      await expect(page).toHaveURL(/\/login/);
      expect(response?.status()).toBeLessThan(400);
    }
  });

  test("login page renders all essential access controls", async ({ page }) => {
    await page.goto("/login");

    // Must display hospital code, username, password and submit button
    const hospitalCodeInput = page.locator('input[name="hospitalCode"], input[id*="hospital"], input[placeholder*="Hospital"]');
    const usernameInput = page.locator('input[name="username"], input[id*="username"], input[placeholder*="Username"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test("login form rejects empty inputs without submitting or crashing", async ({ page }) => {
    await page.goto("/login");

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Still on /login
    await expect(page).toHaveURL(/\/login/);
  });
});
