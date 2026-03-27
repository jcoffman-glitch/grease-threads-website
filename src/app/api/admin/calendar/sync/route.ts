/**
 * Manual calendar sync trigger.
 * POST /api/admin/calendar/sync
 * Auth: admin session (or TEST_AUTH_BYPASS)
 *
 * Immediately runs a calendar poll and returns the sync result.
 * Useful for testing and on-demand refresh.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncCalendarEvents } from "@/lib/calendar";

export async function POST(request: Request) {
  const isTest = process.env.TEST_AUTH_BYPASS === "true";

  if (!isTest) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { startDate, endDate } = body as { startDate?: string; endDate?: string };

    const result = await syncCalendarEvents(startDate, endDate);

    return Response.json({
      success: true,
      jobsCreated: result.created,
      eventsSkipped: result.skipped,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[Calendar Sync] Fatal error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Also support GET for easy browser testing
  return POST(request);
}
