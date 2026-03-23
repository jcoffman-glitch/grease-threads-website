"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Invoice, JobItem } from "@/lib/types";

export default function PublicInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invoice/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("Invoice not found");
        return r.json();
      })
      .then(data => {
        setInvoice(data.invoice);
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><div className="text-4xl mb-2">🔧</div><p className="text-gray-500">Loading invoice...</p></div>
    </div>
  );

  if (error || !invoice) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-2">❌</div>
        <p className="text-gray-700 font-semibold">Invoice not found</p>
        <p className="text-gray-400 text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  const subtotal = invoice.subtotal ?? items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-navy text-white px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black">Grease &amp; Threads</h1>
              <p className="text-white/70 text-sm">HVAC Service &amp; Appliance Repair</p>
              <p className="text-white/70 text-sm">Carlisle, Indiana · (812) 564-3719</p>
            </div>
            <div className="text-right">
              <p className="text-amber font-black text-lg">INVOICE</p>
              <p className="text-white font-bold">{invoice.invoiceNumber}</p>
              <p className="text-white/60 text-xs mt-1">{new Date(invoice.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Bill To</p>
          <p className="font-bold text-navy text-lg">{invoice.customerName}</p>
          <p className="text-gray-500 text-sm">{invoice.customerPhone}</p>
          {invoice.customerEmail && <p className="text-gray-500 text-sm">{invoice.customerEmail}</p>}
        </div>

        {/* Line Items */}
        <div className="px-6 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-2 text-left font-semibold">Description</th>
                <th className="pb-2 text-center font-semibold">Qty</th>
                <th className="pb-2 text-right font-semibold">Price</th>
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-gray-400">No items</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-3 text-navy">{item.description}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 text-right font-semibold text-navy">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="min-w-[200px] space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {(invoice.tax ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax</span><span>${invoice.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-navy">
                <span className="font-black text-navy text-lg">Total Due</span>
                <span className="font-black text-navy text-lg">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        {invoice.status === "Paid" && (
          <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-bold text-lg">✅ Paid — Thank you!</p>
          </div>
        )}

        {/* Pay Now (Phase 2) */}
        {invoice.status !== "Paid" && (
          <div className="px-6 pb-6">
            <button disabled
              className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl text-lg cursor-not-allowed">
              💳 Pay Now — Coming Soon
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              To pay now, please call or text Joe at (812) 564-3719
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-400">Thank you for your business! — Grease &amp; Threads · greasethreads.com</p>
        </div>
      </div>
    </div>
  );
}
