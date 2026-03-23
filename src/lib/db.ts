/**
 * Database abstraction layer for Grease & Threads Admin.
 * 
 * Currently uses GitHub JSON for storage (zero-config, works now).
 * To upgrade to Turso SQLite at the edge:
 *   1. Sign up at https://turso.tech
 *   2. Run: turso db create gnt-db && turso db tokens create gnt-db
 *   3. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN as Vercel env vars
 *   4. npm install @libsql/client
 *   5. Uncomment the Turso implementation below
 */

import { readData, writeData } from "./data";
import type { Job, JobItem, InventoryItem, Invoice, PriceListItem } from "./types";
import { randomUUID } from "crypto";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateJobNumber(jobs: Job[]): string {
  const year = new Date().getFullYear();
  const yearJobs = jobs.filter((j) => j.jobNumber?.startsWith(String(year)));
  const seq = yearJobs.length + 1;
  return `${year}-${String(seq).padStart(4, "0")}`;
}

function generateInvoiceNumber(invoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const seq = invoices.length + 1;
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}

function generateTrackingToken(): string {
  // 8-char alphanumeric token for customer tracking URLs
  return randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export async function dbGetJobs(): Promise<Job[]> {
  return readData<Job>("jobs.json");
}

export async function dbCreateJob(data: Partial<Job>): Promise<Job> {
  const jobs = await dbGetJobs();
  const job: Job = {
    id: randomUUID(),
    jobNumber: generateJobNumber(jobs),
    createdAt: new Date().toISOString(),
    customerName: data.customerName || "",
    customerPhone: data.customerPhone || data.phone || "",
    customerEmail: data.customerEmail,
    serviceType: data.serviceType || "Other",
    problemDescription: data.problemDescription || data.notes || "",
    address: data.address,
    scheduledAt: data.scheduledAt,
    status: data.status || "Lead",
    notes: data.notes,
    trackingToken: generateTrackingToken(),
    googleReviewSent: false,
    sheetsSynced: false,
    // Legacy compat
    date: data.date || new Date().toISOString().split("T")[0],
    phone: data.customerPhone || data.phone || "",
    amount: data.amount || 0,
  };
  await writeData("jobs.json", [...jobs, job]);
  // Fire-and-forget Google Sheets sync
  syncJobToSheets(job).catch(() => {});
  return job;
}

export async function dbUpdateJob(id: string, data: Partial<Job>): Promise<Job | null> {
  const jobs = await dbGetJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  const updated = { ...jobs[idx], ...data, id };
  jobs[idx] = updated;
  await writeData("jobs.json", jobs);
  // Fire-and-forget sync
  syncJobToSheets(updated).catch(() => {});
  return updated;
}

export async function dbDeleteJob(id: string): Promise<void> {
  const jobs = await dbGetJobs();
  await writeData("jobs.json", jobs.filter((j) => j.id !== id));
}

export async function dbGetJobByToken(token: string): Promise<Job | null> {
  const jobs = await dbGetJobs();
  return jobs.find((j) => j.trackingToken === token) || null;
}

// ── Job Items ─────────────────────────────────────────────────────────────────

export async function dbGetJobItems(jobId: string): Promise<JobItem[]> {
  const items = await readData<JobItem>("items.json");
  return items.filter((i) => i.jobId === jobId);
}

export async function dbCreateJobItem(data: Partial<JobItem>): Promise<JobItem> {
  const items = await readData<JobItem>("items.json");
  const item: JobItem = {
    id: randomUUID(),
    jobId: data.jobId || "",
    itemType: data.itemType || "Labor",
    description: data.description || "",
    quantity: data.quantity || 1,
    unitPrice: data.unitPrice || 0,
    createdAt: new Date().toISOString(),
  };
  await writeData("items.json", [...items, item]);
  return item;
}

export async function dbDeleteJobItem(id: string): Promise<void> {
  const items = await readData<JobItem>("items.json");
  await writeData("items.json", items.filter((i) => i.id !== id));
}

// ── Inventory ──────────────────────────────────────────────────────────────────

export async function dbGetInventory(): Promise<InventoryItem[]> {
  return readData<InventoryItem>("inventory.json");
}

export async function dbCreateInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
  const items = await dbGetInventory();
  const item: InventoryItem = {
    id: randomUUID(),
    partNumber: data.partNumber || `PN-${Date.now()}`,
    description: data.description || data.partName || "",
    category: data.category || "General",
    qtyOnHand: data.qtyOnHand ?? data.qty ?? 0,
    reorderPoint: data.reorderPoint || 2,
    unitCost: data.unitCost || 0,
    retailPrice: data.retailPrice || 0,
    supplier: data.supplier,
    updatedAt: new Date().toISOString(),
  };
  await writeData("inventory.json", [...items, item]);
  return item;
}

export async function dbUpdateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem | null> {
  const items = await dbGetInventory();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated = { ...items[idx], ...data, id, updatedAt: new Date().toISOString() };
  items[idx] = updated;
  await writeData("inventory.json", items);
  return updated;
}

export async function dbDeleteInventoryItem(id: string): Promise<void> {
  const items = await dbGetInventory();
  await writeData("inventory.json", items.filter((i) => i.id !== id));
}

// ── Invoices ───────────────────────────────────────────────────────────────────

export async function dbGetInvoices(): Promise<Invoice[]> {
  return readData<Invoice>("invoices.json");
}

export async function dbCreateInvoice(data: Partial<Invoice>): Promise<Invoice> {
  const invoices = await dbGetInvoices();
  const invoice: Invoice = {
    id: randomUUID(),
    invoiceNumber: generateInvoiceNumber(invoices),
    jobId: data.jobId,
    createdAt: new Date().toISOString(),
    customerName: data.customerName || "",
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone || "",
    subtotal: data.subtotal || 0,
    tax: data.tax || 0,
    total: data.total || data.subtotal || 0,
    status: data.status || "Draft",
    paidAt: data.paidAt,
    notes: data.notes,
    items: data.items || [],
    // Legacy compat
    amount: data.total || data.subtotal || 0,
    date: new Date().toISOString().split("T")[0],
  };
  await writeData("invoices.json", [...invoices, invoice]);
  return invoice;
}

export async function dbUpdateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
  const invoices = await dbGetInvoices();
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated = { ...invoices[idx], ...data, id };
  invoices[idx] = updated;
  await writeData("invoices.json", invoices);
  return updated;
}

export async function dbDeleteInvoice(id: string): Promise<void> {
  const invoices = await dbGetInvoices();
  await writeData("invoices.json", invoices.filter((i) => i.id !== id));
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
  // Update job status to Invoiced
  await dbUpdateJob(jobId, { status: "Invoiced" });
  return invoice;
}

// ── Price List ─────────────────────────────────────────────────────────────────

export async function dbGetPriceList(): Promise<PriceListItem[]> {
  const items = await readData<PriceListItem>("price-list.json");
  return items;
}

export async function dbCreatePriceListItem(data: Partial<PriceListItem>): Promise<PriceListItem> {
  const items = await dbGetPriceList();
  const item: PriceListItem = {
    id: randomUUID(),
    name: data.name || "",
    description: data.description,
    defaultPrice: data.defaultPrice || data.price || 0,
    itemType: data.itemType || "Labor",
  };
  await writeData("price-list.json", [...items, item]);
  return item;
}

export async function dbUpdatePriceListItem(id: string, data: Partial<PriceListItem>): Promise<PriceListItem | null> {
  const items = await dbGetPriceList();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated = { ...items[idx], ...data, id };
  items[idx] = updated;
  await writeData("price-list.json", items);
  return updated;
}

export async function dbDeletePriceListItem(id: string): Promise<void> {
  const items = await dbGetPriceList();
  await writeData("price-list.json", items.filter((i) => i.id !== id));
}

// ── Google Sheets Sync (fire-and-forget) ─────────────────────────────────────

async function syncJobToSheets(job: Job): Promise<void> {
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
        grant_type: "refresh_token",
      }),
    });
    if (!tokenRes.ok) return;
    const { access_token } = await tokenRes.json();
    const SHEET_ID = "1MAd1OZ0kxvHYcIQy4aHE_k0RZU0Wk3vpYlQS-xH4MAs";
    const row = [
      job.createdAt,
      job.jobNumber,
      job.customerName,
      job.customerPhone,
      job.serviceType,
      job.problemDescription,
      job.status,
      job.scheduledAt || "",
      job.notes || "",
      job.trackingToken,
    ];
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:J:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [row] }),
      }
    );
  } catch {
    // Non-blocking - silently fail
  }
}
