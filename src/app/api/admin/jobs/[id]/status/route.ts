import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbUpdateJob, dbLogNotification, dbGetJob } from "@/lib/db";
import type { JobStatus } from "@/lib/types";
import { spawnSync } from "child_process";

const GOG_BIN = "/home/coffman34/.npm-global/bin/gog";
const GOG_ACCOUNT = "jcoffman@greasethreads.com";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

async function sendCustomerEmail(jobId: string, event: string, customerEmail: string, customerName: string) {
  try {
    const subjects: Record<string, string> = {
      "en_route": "Your technician is on the way!",
      "on_scene": "Your technician has arrived",
      "complete": "Your service is complete",
      "invoice_sent": "Your invoice from Grease & Threads",
      "receipt": "Payment receipt from Grease & Threads",
    };
    const subject = subjects[event] || `Update on your service - ${event}`;
    const body = `<p>Hi ${customerName},</p><p>This is an update from Grease &amp; Threads regarding your service.</p><p><strong>Status:</strong> ${event}</p><p>Thank you for choosing Grease &amp; Threads!<br>— The GnT Team</p>`;

    const result = spawnSync(
      GOG_BIN,
      ["-a", GOG_ACCOUNT, "gmail", "send", "--to", customerEmail, "--subject", subject, "--body", body, "--html"],
      {
        encoding: "utf8",
        env: { ...process.env, GOG_KEYRING_PASSWORD: "" },
        maxBuffer: 1024 * 1024,
      }
    );

    if (result.status !== 0) {
      console.error(`[Notifications] gog email failed for ${event}:`, result.stderr);
      await dbLogNotification({ jobId, recipient: "customer", type: "email", event, status: "failed" });
    } else {
      await dbLogNotification({ jobId, recipient: "customer", type: "email", event, status: "sent" });
    }
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
