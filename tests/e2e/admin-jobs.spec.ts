import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Admin Jobs", () => {
  let adminPage: ReturnType<typeof test.info>;

  test.beforeEach(async ({ browser }, testInfo) => {
    // Each test gets a fresh context with admin auth
  });

  test("jobs list page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    await page.goto("/admin/jobs");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/admin\/login/);
    // Should have a heading or main content area
    await expect(page.locator("h1, h2, [role='heading']").first()).toBeVisible();
    await context.close();
  });

  test("create job via API", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    const res = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "PLAYWRIGHT_TEST Create",
        customerPhone: "812-555-0100",
        customerEmail: "playwright-test@example.com",
        serviceType: "HVAC",
        problemDescription: "Playwright test job creation",
        address: "456 Test Ave",
        status: "Lead",
      },
    });

    expect(res.ok()).toBeTruthy();
    const job = await res.json();
    expect(job.id).toBeTruthy();

    // Cleanup
    await page.request.delete("/api/admin/jobs", { data: { id: job.id } });
    await context.close();
  });

  test("job detail page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    // Create a job
    const createRes = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "PLAYWRIGHT_TEST Detail",
        customerPhone: "812-555-0101",
        serviceType: "HVAC",
        problemDescription: "Playwright detail page test",
        status: "Lead",
      },
    });
    const job = await createRes.json();

    await page.goto(`/admin/jobs/${job.id}`);
    await page.waitForLoadState("networkidle");
    // Status bar or status field should be visible
    await expect(page.locator("body")).toContainText(/Lead|Scheduled|In Progress|Complete/i);

    // Cleanup
    await page.request.delete("/api/admin/jobs", { data: { id: job.id } });
    await context.close();
  });

  test("update job status via API", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    const createRes = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "PLAYWRIGHT_TEST Update",
        customerPhone: "812-555-0102",
        serviceType: "Appliance Repair",
        problemDescription: "Playwright update test",
        status: "Lead",
      },
    });
    const job = await createRes.json();

    const res = await page.request.put("/api/admin/jobs", {
      data: { id: job.id, status: "Scheduled" },
    });
    expect(res.ok()).toBeTruthy();

    // Cleanup
    await page.request.delete("/api/admin/jobs", { data: { id: job.id } });
    await context.close();
  });

  test("delete job via API", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    const createRes = await page.request.post("/api/admin/jobs", {
      data: {
        customerName: "PLAYWRIGHT_TEST Delete",
        customerPhone: "812-555-0103",
        serviceType: "Handyman",
        problemDescription: "Playwright delete test",
        status: "Lead",
      },
    });
    const job = await createRes.json();

    const delRes = await page.request.delete("/api/admin/jobs", {
      data: { id: job.id },
    });
    expect(delRes.ok()).toBeTruthy();

    // Verify job gone
    const listRes = await page.request.get("/api/admin/jobs");
    const jobs = await listRes.json();
    const found = jobs.find((j: { id: string }) => j.id === job.id);
    expect(found).toBeUndefined();

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    // Cleanup: delete all jobs with PLAYWRIGHT_TEST in customer name
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");

    const listRes = await page.request.get("/api/admin/jobs");
    if (listRes.ok()) {
      const jobs = await listRes.json();
      for (const job of jobs) {
        if (
          job.customerName &&
          job.customerName.includes("PLAYWRIGHT_TEST")
        ) {
          await page.request.delete("/api/admin/jobs", {
            data: { id: job.id },
          });
        }
      }
    }
    await context.close();
  });
});
