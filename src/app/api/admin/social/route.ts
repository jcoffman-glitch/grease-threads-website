import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@libsql/client/http";
import { randomUUID } from "crypto";

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await auth();
  if (denied) return denied;

  const db = getDb();
  const result = await db.execute(
    `SELECT * FROM social_posts ORDER BY COALESCE(scheduled_at, created_at) DESC`
  );
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;

  const body = await request.json();
  const id = randomUUID();
  const db = getDb();

  await db.execute({
    sql: `INSERT INTO social_posts (id, post_type, context_notes, generated_content, scheduled_at, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'Draft', datetime('now'), datetime('now'))`,
    args: [
      id,
      body.post_type || "Other",
      body.context_notes || null,
      body.generated_content || null,
      body.scheduled_at || null,
    ],
  });

  const row = await db.execute({ sql: `SELECT * FROM social_posts WHERE id = ?`, args: [id] });
  return Response.json(row.rows[0], { status: 201 });
}
