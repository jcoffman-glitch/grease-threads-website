import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Technician role", () => {
  test("technician sees dashboard at /admin", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await context.close();
  });

  test("technician sees Jobs in nav", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Jobs/i).first()).toBeVisible();
    await context.close();
  });

  test("technician does NOT see Social in nav", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Social should not be in the navigation
    const socialLinks = page.locator("nav a, aside a, [role='navigation'] a").filter({ hasText: /^Social$/ });
    await expect(socialLinks).toHaveCount(0);
    await context.close();
  });

  test("technician does NOT see Marketing in nav", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const marketingLinks = page.locator("nav a, aside a, [role='navigation'] a").filter({ hasText: /^Marketing$/ });
    await expect(marketingLinks).toHaveCount(0);
    await context.close();
  });

  test("/admin/jobs loads for technician", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "technician");

    await page.goto("/admin/jobs");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await context.close();
  });
});
