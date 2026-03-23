"use client";

import { useEffect, useState } from "react";
import type { Invoice, InvoiceLineItem } from "@/lib/types";

const invoiceStatuses: Invoice["status"][] = ["Draft", "Sent", "Paid", "Overdue"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editing, setEditing] = useState<Partial<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/invoices").then((r) => r.json()).then(setInvoices).finally(() => setLoading(false));
  }, []);

  const outstanding = invoices.filter((i) => i.status !== "Paid").reduce((sum, i) => sum + i.amount, 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const totalAmount = (editing.items || []).reduce((sum, item) => sum + item.total, 0);
    const toSave = { ...editing, amount: totalAmount };
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/invoices", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    });
    const updated = await res.json();
    if (editing.id) {
      setInvoices(invoices.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      setInvoices([...invoices, updated]);
    }
    setEditing(null);
  }

  async function markPaid(invoice: Invoice) {
    const res = await fetch("/api/admin/invoices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...invoice, status: "Paid" }),
    });
    const updated = await res.json();
    setInvoices(invoices.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function remove(id: string) {
    if (!confirm("Delete this invoice?")) return;
    await fetch("/api/admin/invoices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInvoices(invoices.filter((i) => i.id !== id));
  }

  function addLineItem() {
    if (!editing) return;
    const items = [...(editing.items || []), { description: "", qty: 1, unitPrice: 0, total: 0 }];
    setEditing({ ...editing, items });
  }

  function updateLineItem(index: number, field: keyof InvoiceLineItem, value: string | number) {
    if (!editing) return;
    const items = [...(editing.items || [])];
    const item = { ...items[index], [field]: value };
    if (field === "qty" || field === "unitPrice") {
      item.total = Number(item.qty) * Number(item.unitPrice);
    }
    items[index] = item;
    setEditing({ ...editing, items });
  }

  function removeLineItem(index: number) {
    if (!editing) return;
    const items = (editing.items || []).filter((_, i) => i !== index);
    setEditing({ ...editing, items });
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Invoices</h1>
          <p className="text-sm text-gray-500">Outstanding: <span className="font-semibold text-amber-dark">${outstanding.toLocaleString()}</span></p>
        </div>
        <button
          onClick={() => setEditing({ invoiceNumber: "", date: new Date().toISOString().split("T")[0], customer: "", amount: 0, status: "Draft", items: [] })}
          className="px-4 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark transition-colors text-sm font-medium"
        >
          + New Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No invoices yet</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-navy">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.date}</td>
                  <td className="px-4 py-3">{inv.customer}</td>
                  <td className="px-4 py-3">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${invStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {inv.status !== "Paid" && (
                        <button onClick={() => markPaid(inv)} className="text-green-600 hover:text-green-800 text-xs">Paid</button>
                      )}
                      <button onClick={() => setEditing({ ...inv })} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                      <button onClick={() => remove(inv.id)} className="text-red-600 hover:text-red-800 text-xs">Del</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-navy mb-4">{editing.id ? "Edit Invoice" : "New Invoice"}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Invoice #" value={editing.invoiceNumber || ""} onChange={(v) => setEditing({ ...editing, invoiceNumber: v })} />
                <Field label="Date" type="date" value={editing.date || ""} onChange={(v) => setEditing({ ...editing, date: v })} />
              </div>
              <Field label="Customer" value={editing.customer || ""} onChange={(v) => setEditing({ ...editing, customer: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editing.status || "Draft"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as Invoice["status"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  {invoiceStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line Items</label>
                  <button type="button" onClick={addLineItem} className="text-xs text-amber hover:text-amber-dark font-medium">+ Add Item</button>
                </div>
                {(editing.items || []).map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-end">
                    <div className="flex-1">
                      <input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900" />
                    </div>
                    <div className="w-16">
                      <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateLineItem(i, "qty", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900" />
                    </div>
                    <div className="w-24">
                      <input type="number" placeholder="Price" value={item.unitPrice} onChange={(e) => updateLineItem(i, "unitPrice", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900" />
                    </div>
                    <div className="w-20 text-right text-sm py-1.5">${(item.qty * item.unitPrice).toFixed(2)}</div>
                    <button type="button" onClick={() => removeLineItem(i)} className="text-red-500 text-xs pb-1.5">X</button>
                  </div>
                ))}
                <div className="text-right font-semibold text-sm mt-1">
                  Total: ${((editing.items || []).reduce((sum, item) => sum + item.qty * item.unitPrice, 0)).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" className="flex-1 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark font-medium">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
    </div>
  );
}

function invStatusColor(status: string) {
  const colors: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-700",
    Sent: "bg-blue-100 text-blue-700",
    Paid: "bg-green-100 text-green-700",
    Overdue: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
