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
  const role = session.user?.role;
  if (role !== "admin" && role !== "technician" && role !== "it") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
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
    sql: "SELECT id, google_id, email, name, phone, address, city, preferred_contact, notes, created_at FROM customers WHERE id = ?",
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
    notes: row.notes,
    created_at: row.created_at,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await auth();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  // Build SET clause dynamically from allowed fields
  const allowed = ["name", "email", "phone", "address", "city", "preferred_contact", "notes"];
  const sets: string[] = [];
  const args: (string | null)[] = [];
  for (const key of allowed) {
    if (key in body) {
      sets.push(`${key} = ?`);
      args.push(body[key] ?? null);
    }
  }

  if (sets.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  args.push(id);
  await db.execute({
    sql: `UPDATE customers SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });

  // Return updated record
  const result = await db.execute({
    sql: "SELECT id, google_id, email, name, phone, address, city, preferred_contact, notes, created_at FROM customers WHERE id = ?",
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
    notes: row.notes,
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
