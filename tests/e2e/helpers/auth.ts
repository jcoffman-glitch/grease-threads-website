import { type Page } from "@playwright/test";

type Role = "admin" | "technician" | "customer";

const EMAIL_MAP: Record<Role, string> = {
  admin: "gnt-test-admin@greasethreads.com",
  technician: "gnt-test-tech@greasethreads.com",
  customer: "gnt-test-customer@greasethreads.com",
};

/**
 * Log in as the given role via the TEST_AUTH_BYPASS route.
 * Sets the next-auth.session-token cookie on the page's browser context.
 */
export async function loginAs(page: Page, role: Role): Promise<void> {
  const baseURL =
    page.context().pages()[0]?.url().replace(/\/$/, "") ||
    process.env.BASE_URL ||
    "http://localhost:3000";

  // Derive the origin from baseURL for the API call
  const origin = new URL(baseURL).origin;

  const res = await page.request.post(`${origin}/api/auth/test-session`, {
    data: { role, email: EMAIL_MAP[role] },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `loginAs(${role}) failed: ${res.status()} — ${body}`
    );
  }
}
