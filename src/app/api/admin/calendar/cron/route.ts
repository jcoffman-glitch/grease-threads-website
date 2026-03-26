/**
 * Calendar sync cron handler.
 * Called nightly by Vercel Cron at 9 AM UTC.
 * Polls the GnT Google Calendar and auto-creates jobs for new appointment bookings.
 *
 * Trigger: GET /api/admin/calendar/cron
 * Auth: Vercel CRON_SECRET header (or TEST_AUTH_BYPASS in test mode)
 */

import { syncCalendarEvents } from "@/lib/calendar";

export async function GET(request: Request) {
  // Allow bypass in test environments
  const isTest = process.env.TEST_AUTH_BYPASS === "true";

  if (!isTest) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 60);

    const result = await syncCalendarEvents(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    );

    console.log("[Calendar Cron] Sync complete:", result);

    return Response.json({
      success: true,
      jobsCreated: result.created,
      eventsSkipped: result.skipped,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[Calendar Cron] Fatal error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
