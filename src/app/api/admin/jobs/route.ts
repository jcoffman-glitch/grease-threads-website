import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readData, writeData } from "@/lib/data";
import type { Job } from "@/lib/types";

const FILE = "jobs.json";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await auth();
  if (denied) return denied;
  return Response.json(await readData<Job>(FILE));
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const data = await readData<Job>(FILE);
  const item: Job = { ...body, id: crypto.randomUUID() };
  data.push(item);
  await writeData(FILE, data);
  return Response.json(item);
}

export async function PUT(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const data = await readData<Job>(FILE);
  const index = data.findIndex((d) => d.id === body.id);
  if (index === -1) return Response.json({ error: "Not found" }, { status: 404 });
  data[index] = { ...data[index], ...body };
  await writeData(FILE, data);
  return Response.json(data[index]);
}

export async function DELETE(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await request.json();
  const data = await readData<Job>(FILE);
  const filtered = data.filter((d) => d.id !== id);
  await writeData(FILE, filtered);
  return Response.json({ success: true });
}
