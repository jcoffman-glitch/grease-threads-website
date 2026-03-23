import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetInvoices, dbCreateInvoice, dbUpdateInvoice, dbDeleteInvoice } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await auth();
  if (denied) return denied;
  return Response.json(await dbGetInvoices());
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const invoice = await dbCreateInvoice(body);
  return Response.json(invoice);
}

export async function PUT(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const invoice = await dbUpdateInvoice(body.id, body);
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(invoice);
}

export async function DELETE(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await request.json();
  await dbDeleteInvoice(id);
  return Response.json({ success: true });
}
