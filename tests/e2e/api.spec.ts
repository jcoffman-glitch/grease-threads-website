import { test, expect } from "@playwright/test";

test.describe("API smoke tests (no UI)", () => {
  test("GET /api/admin/jobs without auth returns 401", async ({ request }) => {
    const res = await request.fetch("/api/admin/jobs", {
      headers: { cookie: "" },
    });
    // Should be 401 or redirect (302/307) — not 200 with data
    expect([401, 302, 307].includes(res.status())).toBeTruthy();
  });

  test("GET /api/admin/invoices without auth returns 401", async ({
    request,
  }) => {
    const res = await request.fetch("/api/admin/invoices", {
      headers: { cookie: "" },
    });
    expect([401, 302, 307].includes(res.status())).toBeTruthy();
  });

  test("POST /api/contact does not 500", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: {
        name: "PLAYWRIGHT_TEST Contact",
        phone: "812-555-0200",
        email: "playwright-api@example.com",
        serviceType: "HVAC",
        message: "Playwright API smoke test — please ignore",
      },
    });
    expect(res.status()).not.toBe(500);
  });

  test("POST /api/admin/jobs without auth returns 401", async ({ request }) => {
    const res = await request.fetch("/api/admin/jobs", {
      method: "POST",
      headers: { cookie: "", "content-type": "application/json" },
      data: JSON.stringify({
        customerName: "Should Fail",
        serviceType: "HVAC",
      }),
    });
    expect([401, 302, 307].includes(res.status())).toBeTruthy();
  });
});
