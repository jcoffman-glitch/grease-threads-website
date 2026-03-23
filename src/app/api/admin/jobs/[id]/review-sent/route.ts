import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbUpdateJob, dbGetJobs } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const jobs = await dbGetJobs();
  const job = jobs.find((j) => j.id === id);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });

  const timestamp = new Date().toISOString();
  const updatedNotes = job.notes
    ? `${job.notes}\n[Review requested: ${timestamp}]`
    : `[Review requested: ${timestamp}]`;

  const updated = await dbUpdateJob(id, {
    googleReviewSent: true,
    notes: updatedNotes,
  });

  return Response.json(updated);
}
