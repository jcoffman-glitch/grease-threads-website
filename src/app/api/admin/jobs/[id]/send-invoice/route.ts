/**
 * POST /api/admin/jobs/[id]/send-invoice
 *
 * Generates and emails an invoice or receipt for the given job via gog gmail.
 * Body: { email: string, type: "invoice" | "receipt" }
 *
 * On success, updates the job record with invoice_sent_at and invoice_sent_to.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetJob, dbGetJobItems, dbMarkInvoiceSent } from "@/lib/db";
import type { JobItem } from "@/lib/types";
import { spawnSync } from "child_process";

const GOG_BIN = "/home/coffman34/.npm-global/bin/gog";
const GOG_ACCOUNT = "jcoffman@greasethreads.com";

// ── HTML email generator ──────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function buildInvoiceHtml(params: {
  type: "invoice" | "receipt";
  jobNumber: string;
  customerName: string;
  customerAddress?: string;
  serviceType: string;
  serviceDate: string;
  problemDescription: string;
  items: JobItem[];
  subtotal: number;
  total: number;
}): string {
  const {
    type,
    jobNumber,
    customerName,
    customerAddress,
    serviceType,
    serviceDate,
    problemDescription,
    items,
    subtotal,
    total,
  } = params;

  const isReceipt = type === "receipt";
  const title = isReceipt
    ? `Receipt #${esc(jobNumber)}`
    : `Invoice #${esc(jobNumber)}`;
  const badge = isReceipt
    ? `<span style="background:#16a34a;color:#fff;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600;letter-spacing:.5px;">RECEIPT — PAYMENT RECEIVED</span>`
    : "";
  const accentColor = isReceipt ? "#16a34a" : "#1e3a5f";

  const partsRows = items.filter((i) => i.itemType === "Part");
  const laborRows = items.filter((i) => i.itemType === "Labor" || i.itemType === "Diagnostic Fee");
  const otherRows = items.filter((i) => i.itemType === "Other");

  function renderRows(rows: JobItem[], sectionTitle: string): string {
    if (!rows.length) return "";
    const rowHtml = rows
      .map(
        (i) => `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;">${esc(i.description)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(i.unitPrice)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(i.quantity * i.unitPrice)}</td>
      </tr>`
      )
      .join("");
    return `
      <tr>
        <td colspan="4" style="padding:10px 6px 4px;font-weight:700;font-size:13px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">${esc(sectionTitle)}</td>
      </tr>
      ${rowHtml}`;
  }

  const noItems = !items.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:620px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:${accentColor};padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Grease &amp; Threads</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px;">HVAC Service &amp; Appliance Repair — Carlisle, Indiana</p>
            <p style="margin:12px 0 0;color:rgba(255,255,255,.9);font-size:16px;font-weight:600;">${title}</p>
            ${badge ? `<p style="margin:10px 0 0;">${badge}</p>` : ""}
          </td>
        </tr>

        <!-- Meta -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:top;width:50%;">
                  <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Bill To</p>
                  <p style="margin:0;font-weight:600;font-size:15px;">${esc(customerName)}</p>
                  ${customerAddress ? `<p style="margin:2px 0 0;font-size:13px;color:#555;">${esc(customerAddress)}</p>` : ""}
                </td>
                <td style="vertical-align:top;text-align:right;width:50%;">
                  <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Date</p>
                  <p style="margin:0;font-size:14px;">${esc(serviceDate)}</p>
                  <p style="margin:8px 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Service</p>
                  <p style="margin:0;font-size:14px;">${esc(serviceType)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Description -->
        ${
          problemDescription
            ? `<tr><td style="padding:16px 32px 0;">
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Work Performed</p>
          <p style="margin:0;font-size:14px;color:#333;">${esc(problemDescription)}</p>
        </td></tr>`
            : ""
        }

        <!-- Line Items -->
        <tr>
          <td style="padding:20px 32px 0;">
            ${
              noItems
                ? `<p style="margin:0;font-size:14px;color:#888;font-style:italic;">No line items recorded.</p>`
                : `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <thead>
                <tr style="background:#f8f8f8;">
                  <th style="padding:8px 6px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e0e0e0;">Description</th>
                  <th style="padding:8px 6px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e0e0e0;">Qty</th>
                  <th style="padding:8px 6px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e0e0e0;">Unit Price</th>
                  <th style="padding:8px 6px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e0e0e0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(partsRows, "Parts")}
                ${renderRows(laborRows, "Labor")}
                ${renderRows(otherRows, "Other")}
              </tbody>
            </table>`
            }
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="padding:16px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr>
                <td style="text-align:right;padding:4px 6px;color:#555;">Subtotal</td>
                <td style="text-align:right;padding:4px 6px;width:100px;">${fmt(subtotal)}</td>
              </tr>
              <tr>
                <td style="text-align:right;padding:4px 6px;color:#555;">Tax</td>
                <td style="text-align:right;padding:4px 6px;">$0.00</td>
              </tr>
              <tr>
                <td style="text-align:right;padding:8px 6px;font-weight:700;font-size:16px;border-top:2px solid #e0e0e0;">Total</td>
                <td style="text-align:right;padding:8px 6px;font-weight:700;font-size:16px;border-top:2px solid #e0e0e0;color:${accentColor};">${fmt(total)}</td>
              </tr>
              ${
                isReceipt
                  ? `<tr>
                <td colspan="2" style="text-align:right;padding:4px 6px;color:#16a34a;font-weight:600;">✓ Payment Received — Thank You!</td>
              </tr>`
                  : ""
              }
            </table>
          </td>
        </tr>

        <!-- Personal Note -->
        <tr>
          <td style="padding:24px 32px;">
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:4px;">
              <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">Thanks for choosing Grease &amp; Threads — we appreciate your business. Questions? Call Joe at <a href="tel:8125643719" style="color:${accentColor};">812-564-3719</a>.</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;">Grease &amp; Threads · Carlisle, Indiana · 812-564-3719</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const isBypass = process.env.TEST_AUTH_BYPASS === "true";
  if (!session && !isBypass) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Parse and validate body
  let email: string;
  let type: "invoice" | "receipt";
  try {
    const body = await request.json();
    email = typeof body.email === "string" ? body.email.trim() : "";
    type = body.type === "receipt" ? "receipt" : "invoice";
    if (!email) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Fetch job
  const job = await dbGetJob(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  // Fetch line items (non-fatal if missing)
  let items: JobItem[] = [];
  try {
    items = await dbGetJobItems(id);
  } catch {
    // Continue with empty items — don't fail the send
    items = [];
  }

  // Compute totals
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = subtotal;

  // Format service date
  const serviceDate = new Date(job.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jobNumber = job.jobNumber || job.id;

  // Build email content
  const htmlBody = buildInvoiceHtml({
    type,
    jobNumber,
    customerName: job.customerName,
    customerAddress: job.address,
    serviceType: job.serviceType,
    serviceDate,
    problemDescription: job.problemDescription || "",
    items,
    subtotal,
    total,
  });

  const subject =
    type === "receipt"
      ? `Receipt #${jobNumber} from Grease & Threads`
      : `Invoice #${jobNumber} from Grease & Threads`;

  // Send via gog gmail
  const result = spawnSync(
    GOG_BIN,
    ["-a", GOG_ACCOUNT, "gmail", "send", "--to", email, "--subject", subject, "--body", htmlBody, "--html"],
    {
      encoding: "utf8",
      env: { ...process.env, GOG_KEYRING_PASSWORD: "" },
      maxBuffer: 10 * 1024 * 1024,
    }
  );

  if (result.error) {
    return Response.json(
      { success: false, reason: result.error.message },
      { status: 500 }
    );
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() || "gog exited with non-zero status";
    return Response.json(
      { success: false, reason: stderr },
      { status: 500 }
    );
  }

  // Update job record with send timestamp and recipient
  await dbMarkInvoiceSent(id, email);

  return Response.json({
    success: true,
    type,
    sentTo: email,
    jobNumber,
    total,
  });
}
