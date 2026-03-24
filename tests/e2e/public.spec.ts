import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("home page loads and contains Grease", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/Grease/i);
  });

  test("/book page loads with first step visible", async ({ page }) => {
    await page.goto("/book");
    await page.waitForLoadState("networkidle");
    // Step 1 should show service type selection
    await expect(
      page.getByText(/service|what.*help|type/i).first()
    ).toBeVisible();
  });

  test("booking form: fill step 1, advance to step 2, advance to step 3, submit", async ({
    page,
  }) => {
    await page.goto("/book");
    await page.waitForLoadState("networkidle");

    // Step 1: Select a service type
    await page.getByText("HVAC / Heating & Cooling").click();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 2: Describe the problem
    await page.getByPlaceholder(/describe|problem|what/i).first().fill(
      "PLAYWRIGHT_TEST: AC not cooling properly"
    );
    await page.getByText("As soon as possible").click();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 3: Contact info
    await page.getByLabel(/first/i).fill("Playwright");
    await page.getByLabel(/last/i).fill("Test");
    await page.getByLabel(/phone/i).fill("812-555-0199");
    await page.getByLabel(/email/i).fill("playwright-test@example.com");
    await page.getByLabel(/address/i).fill("123 Test St");
    await page.getByRole("button", { name: /next|review/i }).click();

    // Step 4: Review & Submit
    await page.getByRole("button", { name: /submit|book/i }).click();
    await page.waitForLoadState("networkidle");

    // Should show confirmation or redirect — no crash
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("/track/test-token-123 loads without 500 error", async ({ page }) => {
    const response = await page.goto("/track/test-token-123");
    await page.waitForLoadState("networkidle");
    // May show "not found" but should not be a 500
    expect(response?.status()).not.toBe(500);
  });

  test("mobile viewport: home page loads with phone number tap target", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Viewport test on chromium only");

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/Grease/i);

    // Phone number link should exist as a tap target
    const phoneLink = page.locator('a[href^="tel:"]').first();
    await expect(phoneLink).toBeVisible();
  });
});
