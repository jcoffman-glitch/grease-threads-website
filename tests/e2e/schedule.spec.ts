import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Schedule page", () => {
  test("admin can load /admin/schedule", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    await page.goto("/admin/schedule");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await expect(page.getByText(/schedule/i).first()).toBeVisible();
    await context.close();
  });

  test("schedule page shows list or empty state (no crash)", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    await page.goto("/admin/schedule");
    await page.waitForLoadState("networkidle");

    // Page should render content — either jobs or an empty state
    await expect(page.locator("main").first()).not.toBeEmpty();
    await context.close();
  });
});
