import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetJobs, dbGetInvoices } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow customers to see their own jobs
  const requestedEmail = req.nextUrl.searchParams.get("email");
  if (requestedEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [allJobs, allInvoices] = await Promise.all([dbGetJobs(), dbGetInvoices()]);

    // Build a map of jobId -> invoiceId
    const invoiceByJob: Record<string, string> = {};
    for (const inv of allInvoices) {
      if (inv.jobId) invoiceByJob[inv.jobId] = inv.id;
    }

    const customerJobs = allJobs
      .filter((j) => j.customerEmail?.toLowerCase() === session.user.email?.toLowerCase())
      .map((j) => ({
        id: j.id,
        jobNumber: j.jobNumber,
        status: j.status,
        serviceType: j.serviceType,
        createdAt: j.createdAt,
        scheduledAt: j.scheduledAt ?? null,
        problemDescription: j.problemDescription,
        invoiceId: invoiceByJob[j.id] ?? null,
      }));

    return NextResponse.json({ jobs: customerJobs });
  } catch (err) {
    console.error("customer jobs error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
