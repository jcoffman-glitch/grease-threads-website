import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetSubscriptions, dbCreateSubscription, dbUpdateSubscription, dbDeleteSubscription } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await auth();
  if (denied) return denied;
  const subs = await dbGetSubscriptions();
  return Response.json(subs);
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const sub = await dbCreateSubscription(body);
  return Response.json(sub);
}

export async function PUT(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const sub = await dbUpdateSubscription(body.id, body);
  if (!sub) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(sub);
}

export async function DELETE(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await request.json();
  await dbDeleteSubscription(id);
  return Response.json({ success: true });
}
