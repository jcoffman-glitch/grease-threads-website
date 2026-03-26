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

    // Step 1: Verify we're on step 1
    await expect(page.getByText("What can we help with?")).toBeVisible();

    // Step 1: Select a service type
    await page.getByText("HVAC / Heating & Cooling").click();
    // Click Continue button to advance to step 2
    await page.getByRole("button", { name: /continue/i }).first().click();

    // Step 2: Describe the problem
    await expect(page.getByText("What's going on?")).toBeVisible();
    await page.getByPlaceholder(/e\.g\.|describe|problem|stopped|AC/i).first().fill(
      "PLAYWRIGHT_TEST: AC not cooling properly"
    );
    await page.getByPlaceholder("123 Main St").fill("123 Test St");
    await page.getByRole("button", { name: /continue/i }).first().click();

    // Step 3: Contact info — wait for the form to appear
    await expect(page.getByText("How do we reach you?")).toBeVisible();
    // Fill in contact info using role-based selectors (getByLabel has issues with * span)
    const inputs = page.locator("input[type='text'], input[type='tel'], input[type='email']");
    await inputs.nth(0).fill("Playwright"); // First Name
    await inputs.nth(1).fill("Test"); // Last Name
    await inputs.nth(2).fill("812-555-0199"); // Phone
    await inputs.nth(3).fill("playwright-test@example.com"); // Email
    await page.getByText("As soon as possible").click();
    await page.getByRole("button", { name: /continue/i }).first().click();

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

    // Phone number link should exist somewhere in the DOM as a tap target
    const phoneLink = page.locator('a[href^="tel:"]');
    await expect(phoneLink.first()).toBeAttached();
  });
});
