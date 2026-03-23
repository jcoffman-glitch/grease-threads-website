/**
 * Google Sheets data access layer for GnT Admin.
 * Uses OAuth2 with stored credentials (no service account needed).
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN
 */

import { google } from "googleapis";
import type { Job, Invoice } from "./types";

const JOB_TRACKER_ID = "1MAd1OZ0kxvHYcIQy4aHE_k0RZU0Wk3vpYlQS-xH4MAs";
const INVOICE_TRACKER_ID = "1bBpXfY9AgNIJIfSdm7pqE0t3uzPtnjRb4YVSdbuOEEA";

// Job Tracker sheet name and column layout (0-indexed):
// A=Timestamp, B=Job ID, C=Date of Call, D=Customer Name, E=Phone Number,
// F=Service Type, G=Problem Description, H=Scheduled Date/Time, I=Status,
// J=Time Spent (hrs), K=Parts Used, L=Amount Charged, M=Notes for Follow-up
const JOB_SHEET = "Form Responses 2";

// Invoice Tracker columns (0-indexed):
// A=Date, B=Customer Name, C=Invoice #, D=Amount, E=Status, F=File Link, G=Notes
const INVOICE_SHEET = "Sheet1";

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

function rowToJob(row: string[], rowIndex: number): Job {
  // rowIndex is 0-based within the data array; actual sheet row = rowIndex + 2 (row 1 is header)
  return {
    id: String(rowIndex + 2), // sheet row number used as id
    date: row[2] || row[0] || "", // Date of Call (col C), fallback Timestamp (col A)
    customerName: row[3] || "",
    phone: row[4] || "",
    serviceType: row[5] || "",
    status: (row[8] as Job["status"]) || "Called",
    amount: parseFloat(row[11]) || 0,
    notes: row[12] || "",
  };
}

export async function getJobs(): Promise<Job[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: JOB_TRACKER_ID,
    range: `${JOB_SHEET}!A2:M`,
  });
  const rows = res.data.values || [];
  return rows
    .map((row, i) => rowToJob(row as string[], i))
    .filter((j) => j.customerName || j.date);
}

export async function getJob(id: string): Promise<Job | null> {
  const rowNum = parseInt(id);
  if (isNaN(rowNum) || rowNum < 2) return null;
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: JOB_TRACKER_ID,
    range: `${JOB_SHEET}!A${rowNum}:M${rowNum}`,
  });
  const row = res.data.values?.[0] as string[] | undefined;
  if (!row) return null;
  return rowToJob(row, rowNum - 2);
}

export async function createJob(data: Omit<Job, "id">): Promise<Job> {
  const sheets = getSheetsClient();
  const row = [
    new Date().toISOString(), // Timestamp
    "", // Job ID (formula-managed)
    data.date || "",
    data.customerName || "",
    data.phone || "",
    data.serviceType || "",
    "", // Problem Description
    "", // Scheduled Date/Time
    data.status || "Called",
    "", // Time Spent
    "", // Parts Used
    data.amount || 0,
    data.notes || "",
  ];
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: JOB_TRACKER_ID,
    range: `${JOB_SHEET}!A:M`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  const updatedRange = res.data.updates?.updatedRange || "";
  // Extract row number from range like "'Form Responses 2'!A5:M5"
  const match = updatedRange.match(/(\d+):/);
  const newRowNum = match ? parseInt(match[1]) : 0;
  return { ...data, id: String(newRowNum) };
}

export async function updateJob(id: string, data: Partial<Job>): Promise<Job | null> {
  const existing = await getJob(id);
  if (!existing) return null;
  const merged = { ...existing, ...data };
  const rowNum = parseInt(id);
  const sheets = getSheetsClient();
  const row = [
    "", // Timestamp - preserve original by leaving empty (USER_ENTERED won't overwrite existing)
    "", // Job ID
    merged.date || "",
    merged.customerName || "",
    merged.phone || "",
    merged.serviceType || "",
    "", // Problem Description
    "", // Scheduled Date/Time
    merged.status || "Called",
    "", // Time Spent
    "", // Parts Used
    merged.amount || 0,
    merged.notes || "",
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId: JOB_TRACKER_ID,
    range: `${JOB_SHEET}!A${rowNum}:M${rowNum}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  return merged;
}

export async function deleteJob(id: string): Promise<void> {
  const rowNum = parseInt(id);
  if (isNaN(rowNum) || rowNum < 2) return;
  const sheets = getSheetsClient();
  // Get sheet ID
  const meta = await sheets.spreadsheets.get({ spreadsheetId: JOB_TRACKER_ID });
  const sheetObj = meta.data.sheets?.find(
    (s) => s.properties?.title === JOB_SHEET
  );
  const sheetId = sheetObj?.properties?.sheetId ?? 0;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: JOB_TRACKER_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNum - 1,
              endIndex: rowNum,
            },
          },
        },
      ],
    },
  });
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

function rowToInvoice(row: string[], rowIndex: number): Invoice {
  return {
    id: String(rowIndex + 2),
    date: row[0] || "",
    customer: row[1] || "",
    invoiceNumber: row[2] || "",
    amount: parseFloat(row[3]) || 0,
    status: (row[4] as Invoice["status"]) || "Draft",
    items: [],
  };
}

export async function getInvoices(): Promise<Invoice[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: INVOICE_TRACKER_ID,
    range: `${INVOICE_SHEET}!A2:G`,
  });
  const rows = res.data.values || [];
  return rows
    .map((row, i) => rowToInvoice(row as string[], i))
    .filter((inv) => inv.customer || inv.invoiceNumber);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const rowNum = parseInt(id);
  if (isNaN(rowNum) || rowNum < 2) return null;
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: INVOICE_TRACKER_ID,
    range: `${INVOICE_SHEET}!A${rowNum}:G${rowNum}`,
  });
  const row = res.data.values?.[0] as string[] | undefined;
  if (!row) return null;
  return rowToInvoice(row, rowNum - 2);
}

export async function createInvoice(data: Omit<Invoice, "id">): Promise<Invoice> {
  const sheets = getSheetsClient();
  const row = [
    data.date || new Date().toISOString(),
    data.customer || "",
    data.invoiceNumber || "",
    data.amount || 0,
    data.status || "Draft",
    "", // File Link
    "", // Notes
  ];
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: INVOICE_TRACKER_ID,
    range: `${INVOICE_SHEET}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  const updatedRange = res.data.updates?.updatedRange || "";
  const match = updatedRange.match(/(\d+):/);
  const newRowNum = match ? parseInt(match[1]) : 0;
  return { ...data, id: String(newRowNum) };
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
  const existing = await getInvoice(id);
  if (!existing) return null;
  const merged = { ...existing, ...data };
  const rowNum = parseInt(id);
  const sheets = getSheetsClient();
  const row = [
    merged.date || "",
    merged.customer || "",
    merged.invoiceNumber || "",
    merged.amount || 0,
    merged.status || "Draft",
    "", // File Link
    "", // Notes
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId: INVOICE_TRACKER_ID,
    range: `${INVOICE_SHEET}!A${rowNum}:G${rowNum}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  return merged;
}

export async function deleteInvoice(id: string): Promise<void> {
  const rowNum = parseInt(id);
  if (isNaN(rowNum) || rowNum < 2) return;
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: INVOICE_TRACKER_ID });
  const sheetObj = meta.data.sheets?.find(
    (s) => s.properties?.title === INVOICE_SHEET
  );
  const sheetId = sheetObj?.properties?.sheetId ?? 0;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: INVOICE_TRACKER_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNum - 1,
              endIndex: rowNum,
            },
          },
        },
      ],
    },
  });
}
