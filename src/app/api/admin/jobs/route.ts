import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetJobs, dbCreateJob, dbUpdateJob, dbDeleteJob } from "@/lib/db";
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

export async function GET() {
  const denied = await auth();
  if (denied) return denied;
  const jobs = await dbGetJobs();
  return Response.json(jobs);
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const job = await dbCreateJob(body);
  if (job.status === "Lead") {
    await notifyNewLead(job);
  }
  return Response.json(job);
}

export async function PUT(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const job = await dbUpdateJob(body.id, body);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(job);
}

export async function PATCH(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const job = await dbUpdateJob(body.id, body);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(job);
}

export async function DELETE(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await request.json();
  await dbDeleteJob(id);
  return Response.json({ success: true });
}
