import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbUpdateJob } from "@/lib/db";
import type { JobStatus } from "@/lib/types";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;
  const { status } = await request.json();
  const job = await dbUpdateJob(id, { status: status as JobStatus });
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(job);
}
