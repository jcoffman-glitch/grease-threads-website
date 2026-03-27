import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetJobs, dbCreateJob, dbUpdateJob, dbDeleteJob, dbSetJobCalendarEventId } from "@/lib/db";
import { createOrUpdateCalendarEvent } from "@/lib/calendar";
import type { Job } from "@/lib/types";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

async function notifyNewLead(job: Job) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "🔔 New Lead",
        color: 0xF59E0B,
        fields: [
          { name: "Customer", value: job.customerName || "Unknown", inline: true },
          { name: "Phone", value: job.customerPhone || "None", inline: true },
          { name: "Service", value: job.serviceType || "Unknown", inline: true },
          { name: "Problem", value: job.problemDescription || "No description" },
        ],
        timestamp: new Date().toISOString(),
      }]
    }),
  }).catch(() => {});
}

export async function GET(request: Request) {
  try {
    const denied = await auth();
    if (denied) return denied;
    const url = new URL(request.url);
    let jobs = await dbGetJobs();
    if (url.searchParams.get("warranty") === "true") {
      jobs = jobs.filter((j) => j.warrantyFlag);
    }
    return Response.json(jobs);
  } catch (e) {
    console.error("GET /api/admin/jobs error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/**
 * Push job to Google Calendar if it has a scheduled time.
 * Fires & forgets — calendar failure never blocks job creation/update.
 * Skipped in test mode (TEST_AUTH_BYPASS) to avoid polluting production calendar.
 */
async function syncJobToCalendar(job: Job): Promise<void> {
  // Skip in test/CI environments
  if (process.env.TEST_AUTH_BYPASS === "true") return;

  try {
    const eventId = await createOrUpdateCalendarEvent(job);
    if (eventId && !job.googleCalendarEventId) {
      await dbSetJobCalendarEventId(job.id, eventId);
    }
  } catch (err) {
    // Log but don't fail the request
    console.error(`[Calendar Push] Non-fatal: failed to sync job ${job.jobNumber} to calendar:`, err);
  }
}

export async function POST(request: Request) {
  try {
    const denied = await auth();
    if (denied) return denied;
    const body = await request.json();
    const job = await dbCreateJob(body);
    if (job.status === "Lead") {
      await notifyNewLead(job);
    }
    // Push to Google Calendar (non-blocking on failure)
    if (job.scheduledAt || job.status === "Scheduled") {
      syncJobToCalendar(job).catch(() => {});
    }
    return Response.json(job);
  } catch (e) {
    console.error("POST /api/admin/jobs error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const job = await dbUpdateJob(body.id, body);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  // Push schedule update to Google Calendar (non-blocking on failure)
  if (job.scheduledAt || job.status === "Scheduled") {
    syncJobToCalendar(job).catch(() => {});
  }
  return Response.json(job);
}

export async function PATCH(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const job = await dbUpdateJob(body.id, body);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  // Push schedule update to Google Calendar (non-blocking on failure)
  if (job.scheduledAt || job.status === "Scheduled") {
    syncJobToCalendar(job).catch(() => {});
  }
  return Response.json(job);
}

export async function DELETE(request: Request) {
  try {
    const denied = await auth();
    if (denied) return denied;
    const { id } = await request.json();
    await dbDeleteJob(id);
    return Response.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/jobs error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
