import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@libsql/client/http";
import { ensureSchema } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

export async function GET() {
  const denied = await auth();
  if (denied) return denied;

  await ensureSchema();
  const client = getClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const thisMonthStart = `${year}-${month}-01`;
  const nextMonth = now.getMonth() === 11
    ? `${year + 1}-01-01`
    : `${year}-${String(now.getMonth() + 2).padStart(2, "0")}-01`;

  const lastMonthDate = new Date(year, now.getMonth() - 1, 1);
  const lastMonthStart = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonthEnd = thisMonthStart;

  const yearStart = `${year}-01-01`;

  const [
    thisMonthRevRes,
    lastMonthRevRes,
    ytdRevRes,
    outstandingRes,
    serviceTypeMonthRes,
    serviceTypeAllRes,
    jobStatusRes,
    leadSourceMonthRes,
    leadSourceAllRes,
    topCustomersRes,
    recentActivityRes,
    lowInventoryRes,
  ] = await Promise.all([
    // This month revenue (Paid invoices)
    client.execute({
      sql: `SELECT COALESCE(SUM(total), 0) as revenue FROM invoices WHERE status = 'Paid' AND created_at >= ? AND created_at < ?`,
      args: [thisMonthStart, nextMonth],
    }),
    // Last month revenue
    client.execute({
      sql: `SELECT COALESCE(SUM(total), 0) as revenue FROM invoices WHERE status = 'Paid' AND created_at >= ? AND created_at < ?`,
      args: [lastMonthStart, lastMonthEnd],
    }),
    // YTD revenue
    client.execute({
      sql: `SELECT COALESCE(SUM(total), 0) as revenue FROM invoices WHERE status = 'Paid' AND created_at >= ?`,
      args: [yearStart],
    }),
    // Outstanding (not paid)
    client.execute({
      sql: `SELECT COALESCE(SUM(total), 0) as outstanding FROM invoices WHERE status != 'Paid'`,
      args: [],
    }),
    // Jobs by service type this month
    client.execute({
      sql: `SELECT service_type, COUNT(*) as count FROM jobs WHERE created_at >= ? AND created_at < ? GROUP BY service_type ORDER BY count DESC`,
      args: [thisMonthStart, nextMonth],
    }),
    // Jobs by service type all time
    client.execute({
      sql: `SELECT service_type, COUNT(*) as count FROM jobs GROUP BY service_type ORDER BY count DESC`,
      args: [],
    }),
    // Jobs by status
    client.execute({
      sql: `SELECT status, COUNT(*) as count FROM jobs GROUP BY status ORDER BY count DESC`,
      args: [],
    }),
    // Lead sources this month
    client.execute({
      sql: `SELECT lead_source, COUNT(*) as count FROM jobs WHERE created_at >= ? AND created_at < ? GROUP BY lead_source ORDER BY count DESC`,
      args: [thisMonthStart, nextMonth],
    }),
    // Lead sources all time
    client.execute({
      sql: `SELECT lead_source, COUNT(*) as count FROM jobs GROUP BY lead_source ORDER BY count DESC`,
      args: [],
    }),
    // Top customers
    client.execute({
      sql: `SELECT j.customer_name, j.customer_phone, COUNT(j.id) as job_count, COALESCE(SUM(i.total), 0) as total_spent
            FROM jobs j
            LEFT JOIN invoices i ON i.job_id = j.id AND i.status = 'Paid'
            GROUP BY j.customer_name, j.customer_phone
            ORDER BY total_spent DESC
            LIMIT 10`,
      args: [],
    }),
    // Recent activity
    client.execute({
      sql: `SELECT job_number, customer_name, service_type, status, created_at FROM jobs ORDER BY created_at DESC LIMIT 10`,
      args: [],
    }),
    // Low inventory
    client.execute({
      sql: `SELECT description, part_number, qty_on_hand, reorder_point, supplier FROM inventory WHERE qty_on_hand <= reorder_point ORDER BY description`,
      args: [],
    }),
  ]);

  return Response.json({
    revenue: {
      thisMonth: Number(thisMonthRevRes.rows[0]?.revenue ?? 0),
      lastMonth: Number(lastMonthRevRes.rows[0]?.revenue ?? 0),
      ytd: Number(ytdRevRes.rows[0]?.revenue ?? 0),
      outstanding: Number(outstandingRes.rows[0]?.outstanding ?? 0),
    },
    serviceTypeMonth: serviceTypeMonthRes.rows.map(r => ({ serviceType: r.service_type, count: Number(r.count) })),
    serviceTypeAll: serviceTypeAllRes.rows.map(r => ({ serviceType: r.service_type, count: Number(r.count) })),
    jobStatus: jobStatusRes.rows.map(r => ({ status: r.status, count: Number(r.count) })),
    leadSourceMonth: leadSourceMonthRes.rows.map(r => ({ source: r.lead_source, count: Number(r.count) })),
    leadSourceAll: leadSourceAllRes.rows.map(r => ({ source: r.lead_source, count: Number(r.count) })),
    topCustomers: topCustomersRes.rows.map(r => ({
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      jobCount: Number(r.job_count),
      totalSpent: Number(r.total_spent),
    })),
    recentActivity: recentActivityRes.rows.map(r => ({
      jobNumber: r.job_number,
      customerName: r.customer_name,
      serviceType: r.service_type,
      status: r.status,
      createdAt: r.created_at,
    })),
    lowInventory: lowInventoryRes.rows.map(r => ({
      description: r.description,
      partNumber: r.part_number,
      qtyOnHand: Number(r.qty_on_hand),
      reorderPoint: Number(r.reorder_point),
      supplier: r.supplier,
    })),
  });
}
