import { dbGetInvoices, dbGetJobItems } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoices = await dbGetInvoices();
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });

  const items = invoice.jobId ? await dbGetJobItems(invoice.jobId) : [];
  return Response.json({ invoice, items });
}
