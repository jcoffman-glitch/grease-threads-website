import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbGetInvoices, dbGetJobItems, ensureSchema } from "@/lib/db";
import { createClient } from "@libsql/client/http";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;

  const { id } = await params;

  await ensureSchema();
  const invoices = await dbGetInvoices();
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });

  const items = invoice.jobId ? await dbGetJobItems(invoice.jobId) : [];

  // Build a print-friendly HTML invoice
  const lineItemsHtml = items.length > 0
    ? items.map(i => `
      <tr>
        <td style="padding:8px 4px;border-bottom:1px solid #eee;">${i.description}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;">$${i.unitPrice.toFixed(2)}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;">$${(i.quantity * i.unitPrice).toFixed(2)}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" style="padding:8px;text-align:center;color:#999;">No items</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #F59E0B; }
    .company-name { font-size: 22px; font-weight: 900; color: #1a1a2e; }
    .company-info { font-size: 13px; color: #666; margin-top: 6px; line-height: 1.6; }
    .invoice-meta { text-align: right; }
    .invoice-number { font-size: 20px; font-weight: 800; color: #F59E0B; }
    .invoice-date { font-size: 13px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
    .customer-name { font-size: 18px; font-weight: 700; }
    .customer-info { font-size: 13px; color: #555; line-height: 1.7; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px 4px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999; border-bottom: 2px solid #eee; }
    th:last-child, th:nth-child(3), th:nth-child(2) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .total-section { margin-top: 20px; display: flex; justify-content: flex-end; }
    .total-box { background: #f9f9f9; border-radius: 8px; padding: 16px 20px; min-width: 240px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .total-due { display: flex; justify-content: space-between; font-size: 22px; font-weight: 900; color: #1a1a2e; margin-top: 10px; padding-top: 10px; border-top: 2px solid #1a1a2e; }
    .payment-info { margin-top: 30px; background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 4px; }
    .payment-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #92400E; margin-bottom: 4px; }
    .payment-text { font-size: 14px; color: #78350F; }
    .footer { margin-top: 40px; text-align: center; font-size: 13px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">Grease &amp; Threads</div>
      <div class="company-info">
        HVAC Service &amp; Appliance Repair<br>
        Carlisle, Indiana<br>
        📞 (812) 564-3719<br>
        greasethreads.com
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">INVOICE</div>
      <div style="font-size:16px;font-weight:700;margin-top:4px;">${invoice.invoiceNumber}</div>
      <div class="invoice-date">Date: ${new Date(invoice.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
      <div style="margin-top:8px;font-size:13px;font-weight:600;color:${invoice.status === "Paid" ? "#10B981" : "#EF4444"}">
        Status: ${invoice.status}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Bill To</div>
    <div class="customer-name">${invoice.customerName}</div>
    <div class="customer-info">
      ${invoice.customerPhone}<br>
      ${invoice.customerEmail ? invoice.customerEmail + "<br>" : ""}
    </div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-box">
        <div class="total-row"><span>Subtotal</span><span>$${invoice.subtotal.toFixed(2)}</span></div>
        ${invoice.tax > 0 ? `<div class="total-row"><span>Tax</span><span>$${invoice.tax.toFixed(2)}</span></div>` : ""}
        <div class="total-due"><span>Total Due</span><span>$${invoice.total.toFixed(2)}</span></div>
      </div>
    </div>
  </div>

  <div class="payment-info">
    <div class="payment-title">Payment Instructions</div>
    <div class="payment-text">Please contact us to arrange payment. Call or text (812) 564-3719.</div>
  </div>

  <div class="footer">Thank you for your business! — Rick &amp; Grease &amp; Threads</div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
