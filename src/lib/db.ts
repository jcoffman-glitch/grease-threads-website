/**
 * Database layer for Grease & Threads Admin.
 * Uses Turso (libSQL) for persistent SQLite storage.
 */

import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
import type { Job, JobItem, InventoryItem, Invoice, PriceListItem, Subscription, NotificationLog } from "./types";

// Use a local SQLite file when running E2E tests to keep test data off production.
const isTest = process.env.TEST_AUTH_BYPASS === "true";

const client = isTest
  ? createClient({ url: "file:/tmp/gnt-test.db" })
  : createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

// ── Schema Migration (idempotent) ──────────────────────────────────────────────

let schemaEnsured = false;

export async function ensureSchema(): Promise<void> {
  if (schemaEnsured) return;
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      job_number TEXT UNIQUE,
      created_at TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      service_type TEXT,
      problem_description TEXT,
      address TEXT,
      scheduled_at TEXT,
      status TEXT DEFAULT 'Lead',
      notes TEXT,
      tracking_token TEXT UNIQUE,
      google_review_sent INTEGER DEFAULT 0,
      sheets_synced INTEGER DEFAULT 0,
      lead_source TEXT DEFAULT 'direct'
    );
    CREATE TABLE IF NOT EXISTS job_items (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      item_type TEXT,
      description TEXT,
      quantity REAL DEFAULT 1,
      unit_price REAL,
      created_at TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      part_number TEXT UNIQUE,
      description TEXT,
      category TEXT,
      qty_on_hand REAL DEFAULT 0,
      reorder_point REAL DEFAULT 2,
      unit_cost REAL,
      retail_price REAL,
      supplier TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE,
      job_id TEXT,
      created_at TEXT,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      subtotal REAL,
      tax REAL DEFAULT 0,
      total REAL,
      status TEXT DEFAULT 'Draft',
      paid_at TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS price_list (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      default_price REAL,
      item_type TEXT
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      plan_type TEXT,
      recurrence TEXT,
      start_date TEXT,
      next_due TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications_log (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      recipient TEXT,
      type TEXT,
      event TEXT,
      sent_at TEXT,
      status TEXT DEFAULT 'sent'
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      city TEXT,
      google_id TEXT,
      google_review_sent INTEGER DEFAULT 0,
      created_at TEXT,
      notes TEXT,
      preferred_contact TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique ON customers(email) WHERE email IS NOT NULL;
    CREATE TABLE IF NOT EXISTS social_posts (
      id TEXT PRIMARY KEY,
      post_type TEXT DEFAULT 'Other',
      context_notes TEXT,
      generated_content TEXT,
      scheduled_at TEXT,
      status TEXT DEFAULT 'Draft',
      revision_notes TEXT,
      fb_post_id TEXT,
      fb_post_url TEXT,
      posted_at TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);
  // v2 schema migrations — add columns if missing
  const v2Migrations = [
    "ALTER TABLE jobs ADD COLUMN lead_source TEXT DEFAULT 'direct'",
    "ALTER TABLE jobs ADD COLUMN equipment_type TEXT",
    "ALTER TABLE jobs ADD COLUMN model_number TEXT",
    "ALTER TABLE jobs ADD COLUMN ai_suggestions TEXT",
    "ALTER TABLE jobs ADD COLUMN warranty_flag INTEGER DEFAULT 0",
    "ALTER TABLE jobs ADD COLUMN subscription_flag INTEGER DEFAULT 0",
    "ALTER TABLE jobs ADD COLUMN warranty_auth_number TEXT",
    "ALTER TABLE jobs ADD COLUMN warranty_contact TEXT",
    "ALTER TABLE jobs ADD COLUMN warranty_covered TEXT",
    "ALTER TABLE jobs ADD COLUMN warranty_reimbursement REAL",
    "ALTER TABLE jobs ADD COLUMN assigned_to TEXT",
    "ALTER TABLE jobs ADD COLUMN follow_up_required INTEGER DEFAULT 0",
    "ALTER TABLE jobs ADD COLUMN warranty_work_order_number TEXT",
    "ALTER TABLE jobs ADD COLUMN warranty_auth_status TEXT",
    "ALTER TABLE jobs ADD COLUMN warranty_billing_entity TEXT DEFAULT 'Rely Home Warranty'",
    "ALTER TABLE jobs ADD COLUMN warranty_invoice_status TEXT DEFAULT 'not_submitted'",
    "ALTER TABLE jobs ADD COLUMN deductible_collected INTEGER DEFAULT 0",
    "ALTER TABLE jobs ADD COLUMN deductible_amount REAL",
    "ALTER TABLE jobs ADD COLUMN needs_ai_suggestions INTEGER DEFAULT 0",
    "ALTER TABLE jobs ADD COLUMN follow_up_notes TEXT",
    "ALTER TABLE customers ADD COLUMN notes TEXT",
    "ALTER TABLE customers ADD COLUMN preferred_contact TEXT",
    "ALTER TABLE jobs ADD COLUMN google_calendar_event_id TEXT UNIQUE",
    "ALTER TABLE jobs ADD COLUMN google_calendar_synced_at TEXT",
  ];
  for (const sql of v2Migrations) {
    try { await client.execute(sql); } catch { /* column already exists */ }
  }
  schemaEnsured = true;
}

// ── Row Mappers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToJob(r: any): Job {
  return {
    id: r.id,
    jobNumber: r.job_number,
    createdAt: r.created_at,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerEmail: r.customer_email,
    serviceType: r.service_type,
    problemDescription: r.problem_description,
    address: r.address,
    scheduledAt: r.scheduled_at,
    status: r.status,
    notes: r.notes,
    trackingToken: r.tracking_token,
    googleReviewSent: !!r.google_review_sent,
    sheetsSynced: !!r.sheets_synced,
    leadSource: r.lead_source || "direct",
    date: r.created_at?.split("T")[0],
    phone: r.customer_phone,
    amount: 0,
    // v2 fields
    equipmentType: r.equipment_type || undefined,
    modelNumber: r.model_number || undefined,
    aiSuggestions: r.ai_suggestions || undefined,
    warrantyFlag: !!r.warranty_flag,
    subscriptionFlag: !!r.subscription_flag,
    warrantyAuthNumber: r.warranty_auth_number || undefined,
    warrantyContact: r.warranty_contact || undefined,
    warrantyCovered: r.warranty_covered || undefined,
    warrantyReimbursement: r.warranty_reimbursement || undefined,
    warrantyWorkOrderNumber: r.warranty_work_order_number || undefined,
    warrantyAuthStatus: r.warranty_auth_status || undefined,
    warrantyBillingEntity: r.warranty_billing_entity || undefined,
    warrantyInvoiceStatus: r.warranty_invoice_status || undefined,
    deductibleCollected: !!r.deductible_collected,
    deductibleAmount: r.deductible_amount || undefined,
    assignedTo: r.assigned_to || undefined,
    followUpRequired: !!r.follow_up_required,
    followUpNotes: r.follow_up_notes || undefined,
    needsAiSuggestions: Boolean(r.needs_ai_suggestions),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToJobItem(r: any): JobItem {
  return {
    id: r.id,
    jobId: r.job_id,
    itemType: r.item_type,
    description: r.description,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInventory(r: any): InventoryItem {
  return {
    id: r.id,
    partNumber: r.part_number,
    description: r.description,
    category: r.category,
    qtyOnHand: r.qty_on_hand,
    reorderPoint: r.reorder_point,
    unitCost: r.unit_cost,
    retailPrice: r.retail_price,
    supplier: r.supplier,
    updatedAt: r.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInvoice(r: any): Invoice {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    jobId: r.job_id,
    createdAt: r.created_at,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    subtotal: r.subtotal,
    tax: r.tax,
    total: r.total,
    status: r.status,
    paidAt: r.paid_at,
    notes: r.notes,
    items: [],
    amount: r.total,
    date: r.created_at?.split("T")[0],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPriceListItem(r: any): PriceListItem {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    defaultPrice: r.default_price,
    itemType: r.item_type,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function generateJobNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const res = await client.execute({
    sql: `SELECT COUNT(*) as cnt FROM jobs WHERE job_number LIKE ?`,
    args: [`${year}-%`],
  });
  const cnt = Number(res.rows[0].cnt) + 1;
  return `${year}-${String(cnt).padStart(4, "0")}`;
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const res = await client.execute({
    sql: `SELECT COUNT(*) as cnt FROM invoices WHERE invoice_number LIKE ?`,
    args: [`INV-${year}-%`],
  });
  const cnt = Number(res.rows[0].cnt) + 1;
  return `INV-${year}-${String(cnt).padStart(4, "0")}`;
}

function generateTrackingToken(): string {
  return randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export async function dbGetJobs(): Promise<Job[]> {
  await ensureSchema();
  const res = await client.execute("SELECT * FROM jobs ORDER BY created_at DESC");
  return res.rows.map(rowToJob);
}

export async function dbCreateJob(data: Partial<Job>): Promise<Job> {
  await ensureSchema();
  const id = randomUUID();
  const jobNumber = await generateJobNumber();
  const createdAt = new Date().toISOString();
  const trackingToken = generateTrackingToken();

  const customerName = data.customerName || "";
  const customerPhone = data.customerPhone || data.phone || "";
  const customerEmail = data.customerEmail || null;

  // Upsert customer record — every job must have a customer entry
  await upsertCustomerFromJob({ name: customerName, phone: customerPhone, email: customerEmail });

  await client.execute({
    sql: `INSERT INTO jobs (id, job_number, created_at, customer_name, customer_phone, customer_email, service_type, problem_description, address, scheduled_at, status, notes, tracking_token, google_review_sent, sheets_synced, lead_source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
    args: [
      id, jobNumber, createdAt,
      customerName,
      customerPhone,
      customerEmail,
      data.serviceType || "Other",
      data.problemDescription || data.notes || "",
      data.address || null,
      data.scheduledAt || null,
      data.status || "Lead",
      data.notes || null,
      trackingToken,
      data.leadSource || "direct",
    ],
  });
  const row = await client.execute({ sql: "SELECT * FROM jobs WHERE id = ?", args: [id] });
  return rowToJob(row.rows[0]);
}

/**
 * Upsert a customer record from job data.
 * Matches on phone (most reliable for field-created jobs), falls back to email or name.
 * Non-fatal: logs but does not throw on failure so job creation always succeeds.
 */
async function upsertCustomerFromJob(data: { name: string; phone: string; email: string | null }): Promise<void> {
  try {
    const { name, phone, email } = data;
    if (!name && !phone && !email) return; // nothing to upsert

    const customerId = randomUUID();
    const now = Date.now().toString();

    // Try match by phone first, then email
    let existing = phone
      ? await client.execute({ sql: "SELECT id FROM customers WHERE phone = ? LIMIT 1", args: [phone] })
      : { rows: [] };

    if (!existing.rows.length && email) {
      existing = await client.execute({ sql: "SELECT id FROM customers WHERE email = ? LIMIT 1", args: [email] });
    }

    if (existing.rows.length) {
      // Update name/email only if currently empty
      const existingId = existing.rows[0].id as string;
      if (email) {
        await client.execute({
          sql: `UPDATE customers SET email = ? WHERE id = ? AND (email IS NULL OR email = '')`,
          args: [email, existingId],
        });
      }
      if (name) {
        await client.execute({
          sql: `UPDATE customers SET name = ? WHERE id = ? AND (name IS NULL OR name = '')`,
          args: [name, existingId],
        });
      }
    } else {
      await client.execute({
        sql: `INSERT INTO customers (id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)`,
        args: [customerId, name, email || null, phone || null, now],
      });
    }
  } catch (err) {
    console.error("[upsertCustomerFromJob] non-fatal error:", err);
  }
}

export async function dbUpdateJob(id: string, data: Partial<Job>): Promise<Job | null> {
  await ensureSchema();
  const existing = await client.execute({ sql: "SELECT * FROM jobs WHERE id = ?", args: [id] });
  if (!existing.rows.length) return null;
  const cur = rowToJob(existing.rows[0]);
  await client.execute({
    sql: `UPDATE jobs SET customer_name=?, customer_phone=?, customer_email=?, service_type=?, problem_description=?, address=?, scheduled_at=?, status=?, notes=?, google_review_sent=?, sheets_synced=?, lead_source=?, equipment_type=?, model_number=?, ai_suggestions=?, warranty_flag=?, subscription_flag=?, warranty_auth_number=?, warranty_contact=?, warranty_covered=?, warranty_reimbursement=?, assigned_to=?, follow_up_required=?, follow_up_notes=?, warranty_work_order_number=?, warranty_auth_status=?, warranty_billing_entity=?, warranty_invoice_status=?, deductible_collected=?, deductible_amount=?, needs_ai_suggestions=? WHERE id=?`,
    args: [
      data.customerName ?? cur.customerName,
      data.customerPhone ?? cur.customerPhone,
      data.customerEmail ?? cur.customerEmail ?? null,
      data.serviceType ?? cur.serviceType,
      data.problemDescription ?? cur.problemDescription,
      data.address ?? cur.address ?? null,
      data.scheduledAt ?? cur.scheduledAt ?? null,
      data.status ?? cur.status,
      data.notes ?? cur.notes ?? null,
      data.googleReviewSent !== undefined ? (data.googleReviewSent ? 1 : 0) : (cur.googleReviewSent ? 1 : 0),
      data.sheetsSynced !== undefined ? (data.sheetsSynced ? 1 : 0) : (cur.sheetsSynced ? 1 : 0),
      data.leadSource ?? cur.leadSource ?? "direct",
      data.equipmentType ?? cur.equipmentType ?? null,
      data.modelNumber ?? cur.modelNumber ?? null,
      data.aiSuggestions ?? cur.aiSuggestions ?? null,
      data.warrantyFlag !== undefined ? (data.warrantyFlag ? 1 : 0) : (cur.warrantyFlag ? 1 : 0),
      data.subscriptionFlag !== undefined ? (data.subscriptionFlag ? 1 : 0) : (cur.subscriptionFlag ? 1 : 0),
      data.warrantyAuthNumber ?? cur.warrantyAuthNumber ?? null,
      data.warrantyContact ?? cur.warrantyContact ?? null,
      data.warrantyCovered ?? cur.warrantyCovered ?? null,
      data.warrantyReimbursement ?? cur.warrantyReimbursement ?? null,
      data.assignedTo ?? cur.assignedTo ?? null,
      data.followUpRequired !== undefined ? (data.followUpRequired ? 1 : 0) : (cur.followUpRequired ? 1 : 0),
      data.followUpNotes !== undefined ? data.followUpNotes : (cur.followUpNotes ?? null),
      data.warrantyWorkOrderNumber ?? cur.warrantyWorkOrderNumber ?? null,
      data.warrantyAuthStatus ?? cur.warrantyAuthStatus ?? null,
      data.warrantyBillingEntity ?? cur.warrantyBillingEntity ?? null,
      data.warrantyInvoiceStatus ?? cur.warrantyInvoiceStatus ?? null,
      data.deductibleCollected !== undefined ? (data.deductibleCollected ? 1 : 0) : (cur.deductibleCollected ? 1 : 0),
      data.deductibleAmount ?? cur.deductibleAmount ?? null,
      data.needsAiSuggestions !== undefined ? (data.needsAiSuggestions ? 1 : 0) : (cur.needsAiSuggestions ? 1 : 0),
      id,
    ],
  });
  const row = await client.execute({ sql: "SELECT * FROM jobs WHERE id = ?", args: [id] });
  return rowToJob(row.rows[0]);
}

export async function dbDeleteJob(id: string): Promise<void> {
  await ensureSchema();
  // Delete child records first to avoid foreign key constraint violations
  await client.execute({ sql: "DELETE FROM job_items WHERE job_id = ?", args: [id] });
  await client.execute({ sql: "DELETE FROM invoices WHERE job_id = ?", args: [id] });
  await client.execute({ sql: "DELETE FROM jobs WHERE id = ?", args: [id] });
}

export async function dbGetJobByToken(token: string): Promise<Job | null> {
  await ensureSchema();
  const res = await client.execute({ sql: "SELECT * FROM jobs WHERE tracking_token = ?", args: [token] });
  if (!res.rows.length) return null;
  return rowToJob(res.rows[0]);
}

// ── Job Items ─────────────────────────────────────────────────────────────────

export async function dbGetJobItems(jobId: string): Promise<JobItem[]> {
  await ensureSchema();
  const res = await client.execute({ sql: "SELECT * FROM job_items WHERE job_id = ?", args: [jobId] });
  return res.rows.map(rowToJobItem);
}

export async function dbCreateJobItem(data: Partial<JobItem>): Promise<JobItem> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO job_items (id, job_id, item_type, description, quantity, unit_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.jobId || "", data.itemType || "Labor", data.description || "", data.quantity ?? 1, data.unitPrice ?? 0, createdAt],
  });
  const row = await client.execute({ sql: "SELECT * FROM job_items WHERE id = ?", args: [id] });
  return rowToJobItem(row.rows[0]);
}

export async function dbDeleteJobItem(id: string): Promise<void> {
  await ensureSchema();
  await client.execute({ sql: "DELETE FROM job_items WHERE id = ?", args: [id] });
}

// ── Inventory ──────────────────────────────────────────────────────────────────

export async function dbGetInventory(): Promise<InventoryItem[]> {
  await ensureSchema();
  const res = await client.execute("SELECT * FROM inventory ORDER BY description");
  return res.rows.map(rowToInventory);
}

export async function dbCreateInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
  await ensureSchema();
  const id = randomUUID();
  const updatedAt = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO inventory (id, part_number, description, category, qty_on_hand, reorder_point, unit_cost, retail_price, supplier, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.partNumber || `PN-${Date.now()}`,
      data.description || data.partName || "",
      data.category || "General",
      data.qtyOnHand ?? data.qty ?? 0,
      data.reorderPoint ?? 2,
      data.unitCost ?? 0,
      data.retailPrice ?? 0,
      data.supplier || null,
      updatedAt,
    ],
  });
  const row = await client.execute({ sql: "SELECT * FROM inventory WHERE id = ?", args: [id] });
  return rowToInventory(row.rows[0]);
}

export async function dbUpdateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem | null> {
  await ensureSchema();
  const existing = await client.execute({ sql: "SELECT * FROM inventory WHERE id = ?", args: [id] });
  if (!existing.rows.length) return null;
  const cur = rowToInventory(existing.rows[0]);
  const updatedAt = new Date().toISOString();
  await client.execute({
    sql: `UPDATE inventory SET part_number=?, description=?, category=?, qty_on_hand=?, reorder_point=?, unit_cost=?, retail_price=?, supplier=?, updated_at=? WHERE id=?`,
    args: [
      data.partNumber ?? cur.partNumber,
      data.description ?? cur.description,
      data.category ?? cur.category,
      data.qtyOnHand ?? cur.qtyOnHand,
      data.reorderPoint ?? cur.reorderPoint,
      data.unitCost ?? cur.unitCost,
      data.retailPrice ?? cur.retailPrice,
      data.supplier ?? cur.supplier ?? null,
      updatedAt,
      id,
    ],
  });
  const row = await client.execute({ sql: "SELECT * FROM inventory WHERE id = ?", args: [id] });
  return rowToInventory(row.rows[0]);
}

export async function dbDeleteInventoryItem(id: string): Promise<void> {
  await ensureSchema();
  await client.execute({ sql: "DELETE FROM inventory WHERE id = ?", args: [id] });
}

// ── Invoices ───────────────────────────────────────────────────────────────────

export async function dbGetInvoices(): Promise<Invoice[]> {
  await ensureSchema();
  const res = await client.execute("SELECT * FROM invoices ORDER BY created_at DESC");
  return res.rows.map(rowToInvoice);
}

export async function dbCreateInvoice(data: Partial<Invoice>): Promise<Invoice> {
  await ensureSchema();
  const id = randomUUID();
  const invoiceNumber = await generateInvoiceNumber();
  const createdAt = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO invoices (id, invoice_number, job_id, created_at, customer_name, customer_email, customer_phone, subtotal, tax, total, status, paid_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, invoiceNumber,
      data.jobId || null,
      createdAt,
      data.customerName || "",
      data.customerEmail || null,
      data.customerPhone || "",
      data.subtotal ?? 0,
      data.tax ?? 0,
      data.total ?? data.subtotal ?? 0,
      data.status || "Draft",
      data.paidAt || null,
      data.notes || null,
    ],
  });
  const row = await client.execute({ sql: "SELECT * FROM invoices WHERE id = ?", args: [id] });
  return rowToInvoice(row.rows[0]);
}

export async function dbUpdateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
  await ensureSchema();
  const existing = await client.execute({ sql: "SELECT * FROM invoices WHERE id = ?", args: [id] });
  if (!existing.rows.length) return null;
  const cur = rowToInvoice(existing.rows[0]);
  await client.execute({
    sql: `UPDATE invoices SET customer_name=?, customer_email=?, customer_phone=?, subtotal=?, tax=?, total=?, status=?, paid_at=?, notes=? WHERE id=?`,
    args: [
      data.customerName ?? cur.customerName,
      data.customerEmail ?? cur.customerEmail ?? null,
      data.customerPhone ?? cur.customerPhone,
      data.subtotal ?? cur.subtotal,
      data.tax ?? cur.tax,
      data.total ?? cur.total,
      data.status ?? cur.status,
      data.paidAt ?? cur.paidAt ?? null,
      data.notes ?? cur.notes ?? null,
      id,
    ],
  });
  const row = await client.execute({ sql: "SELECT * FROM invoices WHERE id = ?", args: [id] });
  return rowToInvoice(row.rows[0]);
}

export async function dbDeleteInvoice(id: string): Promise<void> {
  await ensureSchema();
  await client.execute({ sql: "DELETE FROM invoices WHERE id = ?", args: [id] });
}

export async function dbGenerateInvoiceFromJob(jobId: string): Promise<Invoice | null> {
  const jobs = await dbGetJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  const items = await dbGetJobItems(jobId);
  const lineItems = items.map((i) => ({
    description: i.description,
    qty: i.quantity,
    unitPrice: i.unitPrice,
    total: i.quantity * i.unitPrice,
  }));
  const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
  const invoice = await dbCreateInvoice({
    jobId,
    customerName: job.customerName,
    customerPhone: job.customerPhone,
    customerEmail: job.customerEmail,
    subtotal,
    tax: 0,
    total: subtotal,
    status: "Draft",
    items: lineItems,
  });
  await dbUpdateJob(jobId, { status: "Invoiced" });
  return invoice;
}

// ── Price List ─────────────────────────────────────────────────────────────────

export async function dbGetPriceList(): Promise<PriceListItem[]> {
  await ensureSchema();
  const res = await client.execute("SELECT * FROM price_list ORDER BY name");
  return res.rows.map(rowToPriceListItem);
}

export async function dbCreatePriceListItem(data: Partial<PriceListItem>): Promise<PriceListItem> {
  await ensureSchema();
  const id = randomUUID();
  await client.execute({
    sql: `INSERT INTO price_list (id, name, description, default_price, item_type) VALUES (?, ?, ?, ?, ?)`,
    args: [id, data.name || "", data.description || null, data.defaultPrice ?? data.price ?? 0, data.itemType || "Labor"],
  });
  const row = await client.execute({ sql: "SELECT * FROM price_list WHERE id = ?", args: [id] });
  return rowToPriceListItem(row.rows[0]);
}

export async function dbUpdatePriceListItem(id: string, data: Partial<PriceListItem>): Promise<PriceListItem | null> {
  await ensureSchema();
  const existing = await client.execute({ sql: "SELECT * FROM price_list WHERE id = ?", args: [id] });
  if (!existing.rows.length) return null;
  const cur = rowToPriceListItem(existing.rows[0]);
  await client.execute({
    sql: `UPDATE price_list SET name=?, description=?, default_price=?, item_type=? WHERE id=?`,
    args: [
      data.name ?? cur.name,
      data.description ?? cur.description ?? null,
      data.defaultPrice ?? cur.defaultPrice,
      data.itemType ?? cur.itemType,
      id,
    ],
  });
  const row = await client.execute({ sql: "SELECT * FROM price_list WHERE id = ?", args: [id] });
  return rowToPriceListItem(row.rows[0]);
}

export async function dbDeletePriceListItem(id: string): Promise<void> {
  await ensureSchema();
  await client.execute({ sql: "DELETE FROM price_list WHERE id = ?", args: [id] });
}

// ── Subscriptions ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSubscription(r: any): Subscription {
  return {
    id: r.id,
    customerId: r.customer_id,
    planType: r.plan_type,
    recurrence: r.recurrence,
    startDate: r.start_date,
    nextDue: r.next_due,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export async function dbGetSubscriptions(): Promise<Subscription[]> {
  await ensureSchema();
  const res = await client.execute("SELECT * FROM subscriptions ORDER BY next_due ASC");
  return res.rows.map(rowToSubscription);
}

export async function dbGetSubscriptionsByCustomer(customerId: string): Promise<Subscription[]> {
  await ensureSchema();
  const res = await client.execute({ sql: "SELECT * FROM subscriptions WHERE customer_id = ?", args: [customerId] });
  return res.rows.map(rowToSubscription);
}

export async function dbCreateSubscription(data: Partial<Subscription>): Promise<Subscription> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO subscriptions (id, customer_id, plan_type, recurrence, start_date, next_due, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.customerId || "", data.planType || "residential", data.recurrence || "{}", data.startDate || createdAt, data.nextDue || data.startDate || createdAt, data.status || "active", data.notes || null, createdAt],
  });
  const row = await client.execute({ sql: "SELECT * FROM subscriptions WHERE id = ?", args: [id] });
  return rowToSubscription(row.rows[0]);
}

export async function dbUpdateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
  await ensureSchema();
  const existing = await client.execute({ sql: "SELECT * FROM subscriptions WHERE id = ?", args: [id] });
  if (!existing.rows.length) return null;
  const cur = rowToSubscription(existing.rows[0]);
  await client.execute({
    sql: `UPDATE subscriptions SET plan_type=?, recurrence=?, start_date=?, next_due=?, status=?, notes=? WHERE id=?`,
    args: [data.planType ?? cur.planType, data.recurrence ?? cur.recurrence, data.startDate ?? cur.startDate, data.nextDue ?? cur.nextDue, data.status ?? cur.status, data.notes ?? cur.notes ?? null, id],
  });
  const row = await client.execute({ sql: "SELECT * FROM subscriptions WHERE id = ?", args: [id] });
  return rowToSubscription(row.rows[0]);
}

export async function dbDeleteSubscription(id: string): Promise<void> {
  await ensureSchema();
  await client.execute({ sql: "DELETE FROM subscriptions WHERE id = ?", args: [id] });
}

// ── Notifications Log ──────────────────────────────────────────────────────

export async function dbLogNotification(data: Partial<NotificationLog>): Promise<void> {
  await ensureSchema();
  const id = randomUUID();
  await client.execute({
    sql: `INSERT INTO notifications_log (id, job_id, recipient, type, event, sent_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.jobId || null, data.recipient || "joe", data.type || "toast", data.event || "", new Date().toISOString(), data.status || "sent"],
  });
}

// ── Calendar Sync Helpers ─────────────────────────────────────────────────

export async function dbGetJobByCalendarEventId(calendarEventId: string): Promise<Job | null> {
  await ensureSchema();
  const res = await client.execute({
    sql: "SELECT * FROM jobs WHERE google_calendar_event_id = ? LIMIT 1",
    args: [calendarEventId],
  });
  if (!res.rows.length) return null;
  return rowToJob(res.rows[0]);
}

export async function dbSetJobCalendarEventId(jobId: string, calendarEventId: string): Promise<void> {
  await ensureSchema();
  await client.execute({
    sql: "UPDATE jobs SET google_calendar_event_id = ?, google_calendar_synced_at = ? WHERE id = ?",
    args: [calendarEventId, new Date().toISOString(), jobId],
  });
}

// ── Get single job by ID ──────────────────────────────────────────────────

export async function dbGetJob(id: string): Promise<Job | null> {
  await ensureSchema();
  const res = await client.execute({ sql: "SELECT * FROM jobs WHERE id = ?", args: [id] });
  if (!res.rows.length) return null;
  return rowToJob(res.rows[0]);
}
