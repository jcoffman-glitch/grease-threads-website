// PUBLIC endpoint — no auth required
import { dbGetJobByToken } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = await dbGetJobByToken(token);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });

  // Return only customer-safe fields
  return Response.json({
    jobNumber: job.jobNumber,
    status: job.status,
    serviceType: job.serviceType,
    customerName: job.customerName,
    scheduledAt: job.scheduledAt,
    problemDescription: job.problemDescription,
  });
}
