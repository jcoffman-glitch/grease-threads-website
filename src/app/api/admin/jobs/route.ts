import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJobs, createJob, updateJob, deleteJob } from "@/lib/sheets";
import type { Job } from "@/lib/types";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await auth();
  if (denied) return denied;
  return Response.json(await getJobs());
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const item = await createJob(body as Omit<Job, "id">);
  return Response.json(item);
}

export async function PUT(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const body = await request.json();
  const item = await updateJob(body.id, body);
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(item);
}

export async function DELETE(request: Request) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await request.json();
  await deleteJob(id);
  return Response.json({ success: true });
}
