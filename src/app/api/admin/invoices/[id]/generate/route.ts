import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGenerateInvoiceFromJob } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;
  const invoice = await dbGenerateInvoiceFromJob(id);
  if (!invoice) return Response.json({ error: "Job not found" }, { status: 404 });
  return Response.json(invoice);
}
