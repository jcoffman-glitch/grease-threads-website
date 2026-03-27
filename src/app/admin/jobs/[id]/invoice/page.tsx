"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Job, JobItem } from "@/lib/types";

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as "invoice" | "receipt") || "invoice";

  const [job, setJob] = useState<Job | null>(null);
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [jobRes, jobItems] = await Promise.all([
        fetch(`/api/admin/jobs/${id}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/jobs/${id}/items`).then(r => r.json()).catch(() => []),
      ]);
      setJob(jobRes);
      setItems(Array.isArray(jobItems) ? jobItems : []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Job not found.</p>
      </div>
    );
  }

  const isReceipt = type === "receipt";
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const formattedDate = job.scheduledAt
    ? new Date(job.scheduledAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const laborItems = items.filter(i => i.itemType === "Labor" || i.itemType === "Diagnostic Fee");
  const partItems = items.filter(i => i.itemType === "Part");
  const otherItems = items.filter(i => i.itemType === "Other");

  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => window.print()}
          className="bg-navy text-white font-bold px-5 py-3 rounded-xl text-sm shadow-lg active:scale-95"
        >
          🖨️ Print
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 font-bold px-4 py-3 rounded-xl text-sm shadow-lg active:scale-95"
        >
          ✕ Close
        </button>
      </div>

      {/* Invoice Document */}
      <div className="min-h-screen bg-white">
        <div className="max-w-[680px] mx-auto p-8 print:p-6 print:max-w-none">

          {/* Document Type Banner */}
          <div className={`text-center mb-6 py-2 rounded-lg text-sm font-black uppercase tracking-widest print:rounded-none ${
            isReceipt
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {isReceipt ? "✅ RECEIPT — Payment Received" : "📄 INVOICE"}
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-black text-navy">Grease &amp; Threads</h1>
              <p className="text-sm text-gray-600 mt-1">HVAC &amp; Appliance Repair</p>
              <p className="text-sm text-gray-600">📞 (812) 629-0000</p>
              <p className="text-sm text-gray-600">📍 Jasper, IN 47546</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{isReceipt ? "Receipt #" : "Invoice #"}</p>
              <p className="text-2xl font-black text-navy">{job.jobNumber}</p>
              <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200 mb-6" />

          {/* Bill To */}
          <div className="mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
            <p className="font-bold text-navy text-lg">{job.customerName}</p>
            {job.address && <p className="text-sm text-gray-600">{job.address}</p>}
            {job.customerEmail && <p className="text-sm text-gray-500">{job.customerEmail}</p>}
            {job.customerPhone && <p className="text-sm text-gray-500">{job.customerPhone}</p>}
          </div>

          {/* Job Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Service Date</p>
              <p className="font-semibold text-navy">{formattedDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Job #</p>
              <p className="font-semibold text-navy">{job.jobNumber}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Description of Work</p>
              <p className="text-gray-700">{job.problemDescription || "General service and repair"}</p>
            </div>
            {job.serviceType && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Service Type</p>
                <p className="text-gray-700">{job.serviceType}</p>
              </div>
            )}
            {job.modelNumber && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Equipment / Model</p>
                <p className="text-gray-700">{job.modelNumber}</p>
              </div>
            )}
          </div>

          {/* Line Items */}
          {items.length > 0 && (
            <div className="mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-navy">
                    <th className="text-left py-2 text-xs text-gray-500 uppercase tracking-wide font-semibold">Description</th>
                    <th className="text-center py-2 text-xs text-gray-500 uppercase tracking-wide font-semibold w-16">Qty</th>
                    <th className="text-right py-2 text-xs text-gray-500 uppercase tracking-wide font-semibold w-24">Unit</th>
                    <th className="text-right py-2 text-xs text-gray-500 uppercase tracking-wide font-semibold w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Labor section */}
                  {laborItems.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={4} className="pt-3 pb-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Labor</span>
                        </td>
                      </tr>
                      {laborItems.map(item => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">{item.description}</td>
                          <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 text-right font-semibold text-navy">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Parts section */}
                  {partItems.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={4} className="pt-3 pb-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Parts</span>
                        </td>
                      </tr>
                      {partItems.map(item => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">{item.description}</td>
                          <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 text-right font-semibold text-navy">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Other section */}
                  {otherItems.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={4} className="pt-3 pb-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Other</span>
                        </td>
                      </tr>
                      {otherItems.map(item => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">{item.description}</td>
                          <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 text-right font-semibold text-navy">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>

              {/* Total */}
              <div className="mt-4 pt-4 border-t-2 border-navy">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-navy">
                    {isReceipt ? "Amount Paid" : "Total Due"}
                  </span>
                  <span className="text-3xl font-black text-navy">${subtotal.toFixed(2)}</span>
                </div>
                {isReceipt && (
                  <p className="text-green-600 text-sm font-semibold mt-1 text-right">✓ Payment Received</p>
                )}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 text-sm mb-6">
              No line items recorded.
            </div>
          )}

          {/* Thank you note */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <p className="text-sm text-gray-600 text-center italic">
              {isReceipt
                ? "Thanks for choosing Grease & Threads — we appreciate your business. 🙏"
                : "Here's your invoice from Grease & Threads — thanks for the business. We appreciate you!"}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-400">
            <p>Grease &amp; Threads · (812) 629-0000 · Jasper, IN 47546</p>
            <p className="mt-1">Job #{job.jobNumber}</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </>
  );
}
