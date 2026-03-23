// PUBLIC endpoint — no auth required, customer-facing invoice view
import { dbGetInvoices, dbGetJobItems } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoices = await dbGetInvoices();
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });

  const items = invoice.jobId ? await dbGetJobItems(invoice.jobId) : [];

  // Return only customer-facing fields — strip internal notes and cost breakdowns
  return Response.json({
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      status: invoice.status,
      paidAt: invoice.paidAt,
      // notes and internal fields intentionally omitted
    },
    items: items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      itemType: item.itemType,
    })),
  });
}
