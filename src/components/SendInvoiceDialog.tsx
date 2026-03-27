"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  jobId: string;
  jobNumber: string;
  customerEmail?: string;
  onClose: () => void;
  onSent: (type: "invoice" | "receipt", sentAt: string) => void;
}

export function SendInvoiceDialog({ jobId, jobNumber, customerEmail, onClose, onSent }: Props) {
  const [email, setEmail] = useState(customerEmail || "");
  const [sending, setSending] = useState<"invoice" | "receipt" | null>(null);
  const [activeTab, setActiveTab] = useState<"invoice" | "receipt">("invoice");

  const noEmail = !customerEmail;

  async function handleSend(type: "invoice" | "receipt") {
    if (!email.trim()) {
      toast.error("Please enter a customer email first.");
      return;
    }
    setSending(type);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/send-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to send. Try again.");
        return;
      }
      const sentAt = new Date().toISOString();
      toast.success(`${type === "invoice" ? "Invoice" : "Receipt"} sent to ${email}`);
      onSent(type, sentAt);
      onClose();
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">Send Invoice / Receipt</h2>
            <p className="text-gray-400 text-xs mt-0.5">Job #{jobNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-5">
            <button
              onClick={() => setActiveTab("invoice")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === "invoice"
                  ? "bg-navy text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              📄 Invoice
            </button>
            <button
              onClick={() => setActiveTab("receipt")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === "receipt"
                  ? "bg-navy text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              ✅ Receipt
            </button>
          </div>

          {/* Email Field */}
          <div className="mb-5">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide block mb-1.5">
              Customer Email
            </label>
            {noEmail && !email && (
              <p className="text-amber-600 text-xs font-medium mb-2 flex items-center gap-1">
                ⚠️ No email on file — enter one below to send
              </p>
            )}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent"
              autoFocus={noEmail}
            />
          </div>

          {/* Content description */}
          <div className="bg-gray-50 rounded-lg p-3 mb-5 text-xs text-gray-600 leading-relaxed">
            {activeTab === "invoice" ? (
              <p>
                <span className="font-semibold">Invoice</span> — Sends a detailed invoice with all
                parts, labor, and total. Includes a note: "Here's your invoice from Grease & Threads —
                thanks for the business."
              </p>
            ) : (
              <p>
                <span className="font-semibold">Receipt</span> — Sends a payment confirmation marked
                "Payment Received." Same line items, marked as a receipt.
              </p>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSend(activeTab)}
            disabled={!email.trim() || sending !== null}
            className="w-full bg-amber text-white font-black py-4 rounded-xl text-base disabled:opacity-50 active:scale-95 transition-transform min-h-[56px]"
          >
            {sending === activeTab ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                Sending...
              </span>
            ) : (
              `Send ${activeTab === "invoice" ? "Invoice" : "Receipt"} →`
            )}
          </button>

          {/* Print link */}
          <a
            href={`/admin/jobs/${jobId}/invoice?type=${activeTab}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-navy font-semibold mt-3 py-2 hover:underline"
          >
            🖨️ Print / Preview instead
          </a>
        </div>
      </div>
    </div>
  );
}
