import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@libsql/client/http";

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  try {
    const result = await db.execute({
      sql: "SELECT name, email, phone, address, city, preferred_contact FROM customers WHERE email = ?",
      args: [session.user.email],
    });

    if (result.rows.length === 0) {
      // Return session data with empty profile fields
      return NextResponse.json({
        name: session.user.name || "",
        email: session.user.email,
        phone: null,
        address: null,
        city: null,
        preferred_contact: "call",
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      name: row.name || session.user.name || "",
      email: row.email || session.user.email,
      phone: row.phone || null,
      address: row.address || null,
      city: row.city || null,
      preferred_contact: row.preferred_contact || "call",
    });
  } catch (err) {
    console.error("profile GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  try {
    const body = await req.json();
    const { phone, address, city, preferred_contact } = body;

    // Check if customer row exists
    const existing = await db.execute({
      sql: "SELECT id FROM customers WHERE email = ?",
      args: [session.user.email],
    });

    if (existing.rows.length === 0) {
      // Insert new customer row
      const id = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO customers (id, email, name, phone, address, city, preferred_contact, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          session.user.email,
          session.user.name || "",
          phone || null,
          address || null,
          city || null,
          preferred_contact || "call",
          Date.now(),
        ],
      });
    } else {
      // Update existing row
      await db.execute({
        sql: `UPDATE customers SET phone = ?, address = ?, city = ?, preferred_contact = ?
              WHERE email = ?`,
        args: [
          phone || null,
          address || null,
          city || null,
          preferred_contact || "call",
          session.user.email,
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("profile PUT error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
