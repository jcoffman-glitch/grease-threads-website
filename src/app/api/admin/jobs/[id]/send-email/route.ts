import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetJobs, dbGetInvoices } from "@/lib/db";
import { resend } from "@/lib/email";
import { confirmationEmail, invoiceEmail, followupEmail } from "@/lib/email-templates";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!resend) {
    return Response.json({ success: false, reason: "Email not configured" });
  }

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

  const result = await resend.emails.send({
    from: "Grease & Threads <noreply@greasethreads.com>",
    to: job.customerEmail,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
  });

  if (result.error) {
    return Response.json({ success: false, reason: result.error.message });
  }

  return Response.json({ success: true, emailId: result.data?.id });
}
