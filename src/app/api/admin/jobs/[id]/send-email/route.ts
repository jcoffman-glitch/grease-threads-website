import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetJobs, dbGetInvoices } from "@/lib/db";
import { confirmationEmail, invoiceEmail, followupEmail } from "@/lib/email-templates";
import { spawnSync } from "child_process";

const GOG_BIN = "/home/coffman34/.npm-global/bin/gog";
const GOG_ACCOUNT = "jcoffman@greasethreads.com";

function sendViaGog(to: string, subject: string, htmlBody: string): { ok: boolean; reason?: string } {
  const result = spawnSync(
    GOG_BIN,
    ["-a", GOG_ACCOUNT, "gmail", "send", "--to", to, "--subject", subject, "--body", htmlBody, "--html"],
    {
      encoding: "utf8",
      env: { ...process.env, GOG_KEYRING_PASSWORD: "" },
      maxBuffer: 10 * 1024 * 1024,
    }
  );
  if (result.error) return { ok: false, reason: result.error.message };
  if (result.status !== 0) return { ok: false, reason: result.stderr?.trim() || "gog exited non-zero" };
  return { ok: true };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { template } = await request.json();

  const jobs = await dbGetJobs();
  const job = jobs.find((j) => j.id === id);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });

  if (!job.customerEmail) {
    return Response.json({ success: false, reason: "No email address on file for this customer" });
  }

  let emailData;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://website-mauve-one-60.vercel.app";

  if (template === "confirmation") {
    emailData = confirmationEmail({
      customerName: job.customerName,
      serviceType: job.serviceType,
      scheduledAt: job.scheduledAt,
    });
  } else if (template === "invoice") {
    const invoices = await dbGetInvoices();
    const invoice = invoices.find((inv) => inv.jobId === id);
    if (!invoice) {
      return Response.json({ success: false, reason: "No invoice found for this job" });
    }
    emailData = invoiceEmail({
      customerName: job.customerName,
      serviceType: job.serviceType,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      invoiceUrl: `${baseUrl}/invoice/${invoice.id}`,
    });
  } else if (template === "followup") {
    emailData = followupEmail({
      customerName: job.customerName,
      serviceType: job.serviceType,
    });
  } else {
    return Response.json({ error: "Invalid template" }, { status: 400 });
  }

  const { ok, reason } = sendViaGog(job.customerEmail, emailData.subject, emailData.html);
  if (!ok) {
    return Response.json({ success: false, reason });
  }

  return Response.json({ success: true });
}
