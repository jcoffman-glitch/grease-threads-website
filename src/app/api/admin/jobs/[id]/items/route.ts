import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetJobItems, dbCreateJobItem, dbDeleteJobItem } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;
  const items = await dbGetJobItems(id);
  return Response.json(items);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();
  const item = await dbCreateJobItem({ ...body, jobId: id });
  return Response.json(item);
}

export async function DELETE(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await request.json();
  await dbDeleteJobItem(id);
  return Response.json({ success: true });
}
