"use client";

import { useEffect, useState } from "react";
import type { Invoice } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
  Overdue: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/invoices").then((r) => r.json()).then(setInvoices).finally(() => setLoading(false));
  }, []);

  async function markPaid(id: string) {
    const res = await fetch("/api/admin/invoices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "Paid", paidAt: new Date().toISOString() }),
    });
    const updated = await res.json();
    setInvoices(invoices.map((i) => (i.id === id ? updated : i)));
  }

  async function deleteInvoice(id: string) {
    if (!confirm("Delete this invoice?")) return;
    await fetch("/api/admin/invoices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setInvoices(invoices.filter((i) => i.id !== id));
  }

  const outstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => sum + (i.total || i.amount || 0), 0);

  if (loading) return <div className="text-gray-500 p-4">Loading invoices...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-navy">Invoices</h1>
        <div className="bg-amber/10 border border-amber/30 rounded-lg px-4 py-2 text-sm">
          <span className="text-gray-600">Outstanding:</span>{" "}
          <span className="font-bold text-amber">${outstanding.toFixed(2)}</span>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-12 text-center text-gray-400">
          No invoices yet. Generate one from a job in the Job Tracker.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {invoices.sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()).map((inv) => {
              const isExpanded = expandedId === inv.id;
              const total = inv.total || inv.amount || 0;
              return (
                <div key={inv.id} className="hover:bg-gray-50">
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : inv.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-navy text-sm">{inv.invoiceNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-700"}`}>{inv.status}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{inv.customerName} · {new Date(inv.createdAt || inv.date || "").toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">${total.toFixed(2)}</div>
                    </div>
                    <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2 text-sm py-3">
                        <div><span className="text-gray-500">Customer:</span> {inv.customerName}</div>
                        <div><span className="text-gray-500">Phone:</span> {inv.customerPhone || "—"}</div>
                        <div><span className="text-gray-500">Email:</span> {inv.customerEmail || "—"}</div>
                        {inv.paidAt && <div><span className="text-gray-500">Paid:</span> {new Date(inv.paidAt).toLocaleDateString()}</div>}
                      </div>

                      {/* Line items */}
                      {inv.items && inv.items.length > 0 && (
                        <table className="w-full text-xs mb-3">
                          <thead>
                            <tr className="text-gray-400 text-left border-b border-gray-100">
                              <th className="py-1">Description</th>
                              <th className="py-1 text-right">Qty</th>
                              <th className="py-1 text-right">Price</th>
                              <th className="py-1 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-gray-50">
                                <td className="py-1.5">{item.description}</td>
                                <td className="py-1.5 text-right">{item.qty}</td>
                                <td className="py-1.5 text-right">${item.unitPrice.toFixed(2)}</td>
                                <td className="py-1.5 text-right">${item.total.toFixed(2)}</td>
                              </tr>
                            ))}
                            <tr className="font-semibold">
                              <td colSpan={3} className="py-2 text-right text-gray-700">
                                {inv.tax > 0 && <>Subtotal: ${inv.subtotal?.toFixed(2)} + Tax: ${inv.tax?.toFixed(2)}<br /></>}
                                Total:
                              </td>
                              <td className="py-2 text-right text-navy">${total.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                      <div className="flex gap-2 mt-2">
                        {inv.status !== "Paid" && (
                          <button onClick={() => markPaid(inv.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                            ✓ Mark Paid
                          </button>
                        )}
                        <button onClick={() => deleteInvoice(inv.id)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
