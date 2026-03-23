import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetPriceList, dbCreatePriceListItem, dbUpdatePriceListItem, dbDeletePriceListItem } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await auth();
  if (denied) return denied;
  return Response.json(await dbGetPriceList());
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const item = await dbCreatePriceListItem(body);
  return Response.json(item);
}

export async function PUT(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const item = await dbUpdatePriceListItem(body.id, body);
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(item);
}

export async function DELETE(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await request.json();
  await dbDeletePriceListItem(id);
  return Response.json({ success: true });
}
