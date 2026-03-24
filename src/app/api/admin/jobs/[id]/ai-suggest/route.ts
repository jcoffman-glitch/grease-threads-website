import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbUpdateJob, dbGetJob } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;

  const job = await dbGetJob(id);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  await dbUpdateJob(id, { needsAiSuggestions: true });

  return Response.json({
    ok: true,
    status: "queued",
    message: "Research queued. Suggestions will appear at the next scheduled run (8am or 8pm CDT).",
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;

  const job = await dbGetJob(id);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  if (job.needsAiSuggestions && !job.aiSuggestions) {
    return Response.json({ suggestions: null, pending: true });
  }

  let suggestions: string[] | string | null = null;
  if (job.aiSuggestions) {
    try {
      suggestions = JSON.parse(job.aiSuggestions);
    } catch {
      suggestions = job.aiSuggestions;
    }
  }

  return Response.json({ suggestions, pending: false });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;

  const job = await dbGetJob(id);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  await dbUpdateJob(id, { needsAiSuggestions: false });

  return Response.json({ ok: true });
}
