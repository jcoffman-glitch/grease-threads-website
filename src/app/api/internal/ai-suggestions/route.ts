import { ensureSchema, dbUpdateJob } from "@/lib/db";
import { createClient } from "@libsql/client";

const isTest = process.env.TEST_AUTH_BYPASS === "true";

const client = isTest
  ? createClient({ url: "file:/tmp/gnt-test.db" })
  : createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

function authInternal(request: Request): Response | null {
  const token = request.headers.get("X-Internal-Token");
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected || token !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const denied = authInternal(request);
  if (denied) return denied;

  await ensureSchema();
  const res = await client.execute(
    "SELECT id, customer_name, problem_description, service_type, equipment_type, model_number FROM jobs WHERE needs_ai_suggestions = 1"
  );

  const jobs = res.rows.map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    problemDescription: r.problem_description,
    serviceType: r.service_type,
    equipmentType: r.equipment_type,
    modelNumber: r.model_number,
  }));

  return Response.json({ jobs });
}

export async function POST(request: Request) {
  const denied = authInternal(request);
  if (denied) return denied;

  await ensureSchema();
  const { jobId, suggestions } = await request.json();

  if (!jobId || !Array.isArray(suggestions)) {
    return Response.json({ error: "jobId (string) and suggestions (string[]) required" }, { status: 400 });
  }

  await dbUpdateJob(jobId, {
    aiSuggestions: JSON.stringify(suggestions),
    needsAiSuggestions: false,
  });

  return Response.json({ ok: true });
}
