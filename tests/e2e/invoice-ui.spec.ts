import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Invoice UI", () => {
  test("Send Invoice button appears on Job Done jobs", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    // Create a job and set it to Job Done status
    const createRes = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "INV_TEST InvoiceUI",
        customerPhone: "812-555-0200",
        customerEmail: "test-invoice@example.com",
        serviceType: "HVAC",
        problemDescription: "Invoice UI test",
        status: "Job Done",
        address: "123 Test St, Jasper IN 47546",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const job = await createRes.json();

    await page.goto(`/admin/jobs/${job.id}`);
    await page.waitForLoadState("networkidle");

    // Send Invoice button should be visible
    const sendBtn = page.getByTestId("send-invoice-btn");
    await expect(sendBtn).toBeVisible();

    // Cleanup
    await page.request.delete("/api/admin/jobs", { data: { id: job.id } });
    await context.close();
  });

  test("Send Invoice dialog opens with pre-filled email", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    const createRes = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "INV_TEST InvoiceDialog",
        customerPhone: "812-555-0201",
        customerEmail: "dialog-test@example.com",
        serviceType: "HVAC",
        problemDescription: "Dialog pre-fill test",
        status: "Job Done",
      },
    });
    const job = await createRes.json();

    await page.goto(`/admin/jobs/${job.id}`);
    await page.waitForLoadState("networkidle");

    // Click Send button (force click since bottom nav may overlap on mobile)
    await page.getByTestId("send-invoice-btn").click({ force: true });

    // Dialog should appear with the email pre-filled
    await expect(page.locator("text=Send Invoice / Receipt")).toBeVisible();
    // Use the dialog-specific email input (placeholder "customer@example.com")
    const emailInput = page.locator('input[placeholder="customer@example.com"]');
    await expect(emailInput).toHaveValue("dialog-test@example.com");

    // Cleanup
    await page.request.delete("/api/admin/jobs", { data: { id: job.id } });
    await context.close();
  });

  test("Send Invoice button NOT visible for Lead status jobs", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    const createRes = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "INV_TEST InvoiceLead",
        customerPhone: "812-555-0202",
        serviceType: "HVAC",
        problemDescription: "Lead status test",
        status: "Lead",
      },
    });
    const job = await createRes.json();

    await page.goto(`/admin/jobs/${job.id}`);
    await page.waitForLoadState("networkidle");

    // Send button should NOT be visible for Lead status
    const sendBtn = page.getByTestId("send-invoice-btn");
    await expect(sendBtn).not.toBeVisible();

    // Cleanup
    await page.request.delete("/api/admin/jobs", { data: { id: job.id } });
    await context.close();
  });

  test("Invoice print page loads for a job", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    const createRes = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "INV_TEST InvoicePrint",
        customerPhone: "812-555-0203",
        customerEmail: "print-test@example.com",
        serviceType: "HVAC",
        problemDescription: "Print page test — HVAC diagnostic and repair",
        status: "Job Done",
        address: "789 Print Ave, Jasper IN 47546",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const job = await createRes.json();
    expect(job.id).toBeTruthy();

    await page.goto(`/admin/jobs/${job.id}/invoice`);
    await page.waitForLoadState("networkidle");

    // Should show Grease & Threads branding (in the invoice header)
    await expect(page.getByRole("main").getByRole("heading", { name: /Grease/i })).toBeVisible();
    // Should show customer name
    await expect(page.locator(`text=INV_TEST InvoicePrint`)).toBeVisible();
    // Should show INVOICE banner
    await expect(page.getByTestId("document-type-banner")).toContainText("INVOICE");
    // Should show Print button
    await expect(page.getByTestId("print-btn")).toBeVisible();

    // Cleanup
    await page.request.delete("/api/admin/jobs", { data: { id: job.id } });
    await context.close();
  });

  test("Invoice print page shows RECEIPT type when type=receipt", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    const createRes = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "INV_TEST InvoiceReceipt",
        customerPhone: "812-555-0204",
        serviceType: "Appliance Repair",
        problemDescription: "Receipt type test",
        status: "Payment",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const job = await createRes.json();
    expect(job.id).toBeTruthy();

    await page.goto(`/admin/jobs/${job.id}/invoice?type=receipt`);
    await page.waitForLoadState("networkidle");

    // Should show RECEIPT banner
    await expect(page.getByTestId("document-type-banner")).toContainText("RECEIPT");
    // Receipt # label instead of Invoice #
    await expect(page.locator("text=Receipt #")).toBeVisible();

    // Cleanup
    await page.request.delete("/api/admin/jobs", { data: { id: job.id } });
    await context.close();
  });

  // Note: each test cleans up its own job. No afterAll needed — batch cleanup
  // would race with sibling workers running the same tests in parallel.
});
