import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbUpdateJob, dbLogNotification, dbGetJob } from "@/lib/db";
import type { JobStatus } from "@/lib/types";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

async function sendCustomerEmail(jobId: string, event: string, customerEmail: string, customerName: string) {
  // Only send if RESEND_API_KEY is set
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Notifications] Skipping customer email (RESEND_API_KEY not set): ${event} for ${customerName}`);
    return;
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subjects: Record<string, string> = {
      "en_route": "Your technician is on the way!",
      "on_scene": "Your technician has arrived",
      "complete": "Your service is complete",
      "invoice_sent": "Your invoice from Grease & Threads",
      "receipt": "Payment receipt from Grease & Threads",
    };
    await resend.emails.send({
      from: "Grease & Threads <notifications@greasethreads.com>",
      to: customerEmail,
      subject: subjects[event] || `Update on your service - ${event}`,
      text: `Hi ${customerName},\n\nThis is an update from Grease & Threads regarding your service.\n\nStatus: ${event}\n\nThank you for choosing Grease & Threads!\n\n- The GnT Team`,
    });
    await dbLogNotification({ jobId, recipient: "customer", type: "email", event, status: "sent" });
  } catch (e) {
    console.error(`[Notifications] Email failed for ${event}:`, e);
    await dbLogNotification({ jobId, recipient: "customer", type: "email", event, status: "failed" });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;
  const { status } = await request.json();

  const oldJob = await dbGetJob(id);
  const job = await dbUpdateJob(id, { status: status as JobStatus });
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });

  // Fire notifications based on status change
  const oldStatus = oldJob?.status;
  if (oldStatus !== status) {
    // Log toast notifications — supports both v3 and legacy statuses
    switch (status) {
      case "En Route":
        await dbLogNotification({ jobId: id, recipient: "joe", type: "toast", event: "en_route" });
        if (job.customerEmail) {
          sendCustomerEmail(id, "en_route", job.customerEmail, job.customerName);
        }
        break;
      case "Working":
      case "On Scene":
        if (job.customerEmail) {
          sendCustomerEmail(id, "on_scene", job.customerEmail, job.customerName);
        }
        break;
      case "Job Done":
      case "Complete":
      case "Completed":
        await dbLogNotification({ jobId: id, recipient: "joe", type: "toast", event: "complete" });
        if (job.customerEmail) {
          sendCustomerEmail(id, "complete", job.customerEmail, job.customerName);
        }
        break;
      case "Final Invoice":
      case "Invoiced":
        await dbLogNotification({ jobId: id, recipient: "joe", type: "toast", event: "invoice_sent" });
        if (job.customerEmail) {
          sendCustomerEmail(id, "invoice_sent", job.customerEmail, job.customerName);
        }
        break;
      case "Payment":
      case "Paid":
        await dbLogNotification({ jobId: id, recipient: "joe", type: "toast", event: "payment_received" });
        if (job.customerEmail) {
          sendCustomerEmail(id, "receipt", job.customerEmail, job.customerName);
        }
        break;
    }

    // Log Anthoney notifications for assigned jobs
    if (job.assignedTo === "anthoney") {
      if (status === "Work Order" || status === "Scheduled" || status === "New") {
        await dbLogNotification({ jobId: id, recipient: "anthoney", type: "toast", event: "job_assigned" });
      }
    }
  }

  return Response.json(job);
}
