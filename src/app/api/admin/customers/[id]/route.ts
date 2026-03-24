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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await auth();
  if (denied) return denied;

  const { id } = await params;
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT id, google_id, email, name, phone, address, city, preferred_contact, created_at FROM customers WHERE id = ?",
    args: [id],
  });

  if (!result.rows.length) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const row = result.rows[0];
  return Response.json({
    id: row.id,
    google_id: row.google_id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    address: row.address,
    city: row.city,
    preferred_contact: row.preferred_contact,
    created_at: row.created_at,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await auth();
  if (denied) return denied;

  const { id } = await params;
  const db = getDb();
  await db.execute({ sql: "DELETE FROM customers WHERE id = ?", args: [id] });

  return Response.json({ success: true });
}
