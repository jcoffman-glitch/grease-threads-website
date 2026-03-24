import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetJob } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;
  const job = await dbGetJob(id);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(job);
}
