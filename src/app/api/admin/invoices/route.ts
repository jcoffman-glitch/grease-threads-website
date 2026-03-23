import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from "@/lib/sheets";
import type { Invoice } from "@/lib/types";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await auth();
  if (denied) return denied;
  return Response.json(await getInvoices());
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const item = await createInvoice(body as Omit<Invoice, "id">);
  return Response.json(item);
}

export async function PUT(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const item = await updateInvoice(body.id, body);
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(item);
}

export async function DELETE(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await request.json();
  await deleteInvoice(id);
  return Response.json({ success: true });
}
