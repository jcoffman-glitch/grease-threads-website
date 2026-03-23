export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/** Escape HTML special characters to prevent injection in email templates */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function confirmationEmail(params: {
  customerName: string;
  serviceType: string;
  scheduledAt?: string;
}): EmailTemplate {
  const firstName = esc(params.customerName.split(" ")[0]);
  const serviceType = esc(params.serviceType);
  const dateStr = params.scheduledAt
    ? new Date(params.scheduledAt).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "the scheduled time";

  const subject = "Your appointment is confirmed — Grease & Threads";
  const text = `Hi ${firstName},\n\nYour service appointment is confirmed for ${dateStr}. Joe will be there to take care of ${params.serviceType}.\n\nQuestions? Call 812-564-3719.\n\nThanks for choosing Grease & Threads!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">✅ Appointment Confirmed</h2>
      <p>Hi ${firstName},</p>
      <p>Your service appointment is confirmed for <strong>${dateStr}</strong>. Joe will be there to take care of <strong>${serviceType}</strong>.</p>
      <p>Questions? Call <a href="tel:8125643719">812-564-3719</a>.</p>
      <p>Thanks for choosing Grease & Threads!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #888; font-size: 12px;">Grease & Threads HVAC Service and Appliance Repair — Carlisle, Indiana</p>
    </div>
  `;
  return { subject, html, text };
}

export function invoiceEmail(params: {
  customerName: string;
  serviceType: string;
  invoiceNumber: string;
  total: number;
  invoiceUrl: string;
}): EmailTemplate {
  const firstName = esc(params.customerName.split(" ")[0]);
  const serviceType = esc(params.serviceType);
  const invoiceNumber = esc(params.invoiceNumber);
  // invoiceUrl is generated internally from trusted invoice ID — still escape for safety
  const invoiceUrl = esc(params.invoiceUrl);
  const subject = `Invoice from Grease & Threads — ${params.invoiceNumber}`;
  const text = `Hi ${firstName},\n\nYour invoice for ${params.serviceType} is ready.\n\nTotal: $${params.total.toFixed(2)}\n\nView your invoice: ${params.invoiceUrl}\n\nThanks for your business!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">🧾 Invoice Ready</h2>
      <p>Hi ${firstName},</p>
      <p>Your invoice for <strong>${serviceType}</strong> is ready.</p>
      <p style="font-size: 1.2em;"><strong>Total: $${params.total.toFixed(2)}</strong></p>
      <p><a href="${invoiceUrl}" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a></p>
      <p>Thanks for your business!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #888; font-size: 12px;">Grease & Threads HVAC Service and Appliance Repair — Carlisle, Indiana</p>
    </div>
  `;
  return { subject, html, text };
}

export function followupEmail(params: {
  customerName: string;
  serviceType: string;
  bookingLink?: string;
}): EmailTemplate {
  const firstName = esc(params.customerName.split(" ")[0]);
  const serviceType = esc(params.serviceType);
  const bookingLink = params.bookingLink || "https://calendar.app.google/NEBSdUFjbUY7yPxF6";
  const subject = "Time for a tune-up? — Grease & Threads";
  const text = `Hi ${firstName},\n\nIt's been about a month since Joe serviced your ${params.serviceType}. Regular maintenance keeps things running longer and prevents costly breakdowns.\n\nGive us a call at 812-564-3719 or book online: ${bookingLink}\n\n— Grease & Threads`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">🔧 Time for a tune-up?</h2>
      <p>Hi ${firstName},</p>
      <p>It's been about a month since Joe serviced your <strong>${serviceType}</strong>. Regular maintenance keeps things running longer and prevents costly breakdowns.</p>
      <p>Give us a call at <a href="tel:8125643719">812-564-3719</a> or <a href="${bookingLink}">book online</a>.</p>
      <p>— Grease & Threads</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #888; font-size: 12px;">Grease & Threads HVAC Service and Appliance Repair — Carlisle, Indiana</p>
    </div>
  `;
  return { subject, html, text };
}
