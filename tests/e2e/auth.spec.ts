import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Authentication", () => {
  test("unauthenticated /admin redirects to /admin/login", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/login/);
    await context.close();
  });

  test("admin can access /admin", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await context.close();
  });

  test("admin can access /admin/social, /admin/marketing, /admin/reports", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    for (const route of ["/admin/social", "/admin/marketing", "/admin/reports"]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(page).not.toHaveURL(/\/admin\/login/);
    }
    await context.close();
  });

  test("technician can access /admin", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await context.close();
  });

  test("technician is blocked from /admin/social", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin/social");
    await page.waitForLoadState("networkidle");
    // Should redirect back to /admin (blocked)
    await expect(page).toHaveURL(/\/admin$/);
    await context.close();
  });

  test("technician is blocked from /admin/marketing", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin/marketing");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin$/);
    await context.close();
  });

  test("technician is blocked from /admin/reports", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin/reports");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin$/);
    await context.close();
  });

  test("session survives page reload", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await context.close();
  });
});
