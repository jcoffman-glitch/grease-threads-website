import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@libsql/client/http";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await auth();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const fields: string[] = [];
  const args: unknown[] = [];

  if (body.status !== undefined) { fields.push("status = ?"); args.push(body.status); }
  if (body.revision_notes !== undefined) { fields.push("revision_notes = ?"); args.push(body.revision_notes); }
  if (body.scheduled_at !== undefined) { fields.push("scheduled_at = ?"); args.push(body.scheduled_at); }
  if (body.generated_content !== undefined) { fields.push("generated_content = ?"); args.push(body.generated_content); }
  if (body.fb_post_id !== undefined) { fields.push("fb_post_id = ?"); args.push(body.fb_post_id); }
  if (body.fb_post_url !== undefined) { fields.push("fb_post_url = ?"); args.push(body.fb_post_url); }
  if (body.status === "Posted") { fields.push("posted_at = datetime('now')"); }

  fields.push("updated_at = datetime('now')");
  args.push(id);

  await db.execute({
    sql: `UPDATE social_posts SET ${fields.join(", ")} WHERE id = ?`,
    args,
  });

  const row = await db.execute({ sql: `SELECT * FROM social_posts WHERE id = ?`, args: [id] });
  return Response.json(row.rows[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await auth();
  if (denied) return denied;

  const { id } = await params;
  const db = getDb();
  await db.execute({ sql: `DELETE FROM social_posts WHERE id = ?`, args: [id] });
  return Response.json({ success: true });
}
