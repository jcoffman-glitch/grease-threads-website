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

export async function GET() {
  const denied = await auth();
  if (denied) return denied;

  const db = getDb();
  const result = await db.execute(
    "SELECT id, google_id, email, name, phone, address, city, preferred_contact, created_at FROM customers ORDER BY created_at DESC"
  );

  const customers = result.rows.map((row) => ({
    id: row[0],
    google_id: row[1],
    email: row[2],
    name: row[3],
    phone: row[4],
    address: row[5],
    city: row[6],
    preferred_contact: row[7],
    created_at: row[8],
  }));

  return Response.json(customers);
}
