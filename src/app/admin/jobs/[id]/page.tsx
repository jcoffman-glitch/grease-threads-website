"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Job, JobItem, Invoice, PriceListItem } from "@/lib/types";

const STATUSES = ["Lead", "Scheduled", "In Progress", "Completed", "Invoiced", "Paid"] as const;
const SERVICE_TYPES = ["HVAC", "Appliance Repair", "Commercial Kitchen", "Handyman", "Other"];
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJaxfsFK2hhkYRlSUOXJr5gfk";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Lead: "bg-gray-100 text-gray-700",
    Called: "bg-blue-100 text-blue-700",
    Scheduled: "bg-indigo-100 text-indigo-700",
    "In Progress": "bg-yellow-100 text-yellow-800",
    Completed: "bg-green-100 text-green-700",
    Invoiced: "bg-purple-100 text-purple-700",
    Paid: "bg-teal-100 text-teal-700",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [items, setItems] = useState<JobItem[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Job>>({});
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unitPrice: 0, itemType: "Labor" });
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [jobs, invs, plist] = await Promise.all([
      fetch("/api/admin/jobs").then(r => r.json()).catch(() => []),
      fetch("/api/admin/invoices").then(r => r.json()).catch(() => []),
      fetch("/api/admin/price-list").then(r => r.json()).catch(() => []),
    ]);
    const found = Array.isArray(jobs) ? jobs.find((j: Job) => j.id === id) : null;
    if (!found) { router.push("/admin/jobs"); return; }
    setJob(found);
    setEditForm(found);
    setPriceList(Array.isArray(plist) ? plist : []);

    const jobItems = await fetch(`/api/admin/jobs/${id}/items`).then(r => r.json()).catch(() => []);
    setItems(Array.isArray(jobItems) ? jobItems : []);

    const foundInvoice = Array.isArray(invs) ? invs.find((i: Invoice) => i.jobId === id) : null;
    setInvoice(foundInvoice || null);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(newStatus: string) {
    if (!job) return;
    if (newStatus === "In Progress") {
      setStatusConfirm(newStatus);
      return;
    }
    await applyStatus(newStatus);
  }

  async function applyStatus(newStatus: string) {
    if (!job) return;
    const res = await fetch(`/api/admin/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setJob(updated);
    setStatusConfirm(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, id }),
    });
    const updated = await res.json();
    setJob(updated);
    setEditing(false);
    setSaving(false);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/jobs/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newItem, jobId: id }),
    });
    const created = await res.json();
    setItems(prev => [...prev, created]);
    setNewItem({ description: "", quantity: 1, unitPrice: 0, itemType: "Labor" });
    setAddingItem(false);
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/admin/jobs/${id}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    });
    setItems(prev => prev.filter(i => i.id !== itemId));
  }

  async function generateInvoice() {
    setGeneratingInvoice(true);
    const res = await fetch(`/api/admin/invoices/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const inv = await res.json();
    setInvoice(inv);
    setJob(prev => prev ? { ...prev, status: "Invoiced" } : prev);
    setGeneratingInvoice(false);
  }

  async function toggleReviewSent(sent: boolean) {
    const res = await fetch("/api/admin/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, googleReviewSent: sent }),
    });
    const updated = await res.json();
    setJob(updated);
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center"><div className="text-4xl mb-2">🔧</div><p className="text-gray-500">Loading...</p></div>
    </div>
  );

  if (!job) return null;

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const showInvoiceSection = ["Completed", "Invoiced", "Paid"].includes(job.status);
  const showReviewPrompt = ["Completed", "Paid"].includes(job.status);
  const reviewMessage = `Hi ${job.customerName}! Thanks for calling Grease & Threads. If you have a moment, a Google review really helps: ${GOOGLE_REVIEW_URL} — Thanks! -Joe`;
  const trackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/track/${job.trackingToken}`
    : `/track/${job.trackingToken}`;

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Status Confirm Modal */}
      {statusConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg text-navy mb-2">Moving to In Progress</h3>
            <p className="text-gray-600 mb-5">Send &quot;On my way&quot; notification to {job.customerName}?</p>
            <div className="flex gap-3">
              <button onClick={() => { console.log("On my way notification queued (Phase 2)"); applyStatus(statusConfirm); }}
                className="flex-1 bg-amber text-white font-bold py-3 rounded-xl">Yes, Send</button>
              <button onClick={() => applyStatus(statusConfirm)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">Skip</button>
            </div>
            <button onClick={() => setStatusConfirm(null)} className="w-full mt-2 text-gray-400 text-sm py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mb-4">
        <Link href="/admin/jobs" className="text-blue-600 text-sm flex items-center gap-1">
          ← All Jobs
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-gray-400 font-mono">{job.jobNumber}</p>
            <h1 className="text-xl font-black text-navy">{job.customerName}</h1>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <div className="space-y-2">
          <a href={`tel:${job.customerPhone}`}
            className="flex items-center gap-2 text-blue-600 font-semibold text-lg">
            📞 {job.customerPhone}
          </a>
          {job.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600">
              📍 {job.address}
            </a>
          )}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="font-bold text-navy mb-3 text-sm uppercase tracking-wide">Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all active:scale-95 ${
                job.status === s
                  ? "border-amber bg-amber text-white"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-amber"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Job Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide">Job Info</h2>
          <button onClick={() => setEditing(!editing)}
            className="text-sm text-blue-600 font-semibold">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-3">
            <select value={editForm.serviceType} onChange={e => setEditForm(f => ({ ...f, serviceType: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2">
              {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
            <textarea value={editForm.problemDescription || ""} onChange={e => setEditForm(f => ({ ...f, problemDescription: e.target.value }))}
              placeholder="Problem description" rows={3} className="w-full border rounded-lg px-3 py-2" />
            <input type="datetime-local" value={editForm.scheduledAt?.slice(0, 16) || ""}
              onChange={e => setEditForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2" />
            <textarea value={editForm.notes || ""} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes" rows={2} className="w-full border rounded-lg px-3 py-2" />
            <button type="submit" disabled={saving}
              className="w-full bg-amber text-white font-bold py-3 rounded-xl disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-400">Service:</span> <span className="font-semibold">{job.serviceType}</span></div>
            <div><span className="text-gray-400">Problem:</span> <span>{job.problemDescription}</span></div>
            {job.scheduledAt && (
              <div><span className="text-gray-400">Scheduled:</span> <span className="font-semibold">{new Date(job.scheduledAt).toLocaleString()}</span></div>
            )}
            {job.notes && <div><span className="text-gray-400">Notes:</span> <span>{job.notes}</span></div>}
          </div>
        )}
      </div>

      {/* Parts & Labor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide">Parts &amp; Labor</h2>
          <button onClick={() => setAddingItem(!addingItem)}
            className="bg-amber text-white text-sm font-semibold px-3 py-1.5 rounded-lg">
            + Add Item
          </button>
        </div>

        {addingItem && (
          <form onSubmit={addItem} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <select value={newItem.itemType}
              onChange={e => {
                const pl = priceList.find(p => p.name === e.target.value);
                if (pl) {
                  setNewItem(n => ({ ...n, itemType: e.target.value, description: pl.name, unitPrice: pl.defaultPrice }));
                } else {
                  setNewItem(n => ({ ...n, itemType: e.target.value }));
                }
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">— Select from price list —</option>
              {priceList.map(p => (
                <option key={p.id} value={p.name}>{p.name} (${p.defaultPrice})</option>
              ))}
              <option value="Labor">Custom Labor</option>
              <option value="Part">Custom Part</option>
              <option value="Other">Other</option>
            </select>
            <input placeholder="Description" required value={newItem.description}
              onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Qty</label>
                <input type="number" min="0.01" step="0.01" value={newItem.quantity}
                  onChange={e => setNewItem(n => ({ ...n, quantity: parseFloat(e.target.value) || 1 }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Unit Price</label>
                <input type="number" min="0" step="0.01" value={newItem.unitPrice}
                  onChange={e => setNewItem(n => ({ ...n, unitPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-amber text-white font-bold py-2 rounded-lg text-sm">Add</button>
              <button type="button" onClick={() => setAddingItem(false)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No items yet — tap Add Item to log parts &amp; labor</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{item.description}</p>
                  <p className="text-xs text-gray-400">{item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                </div>
                <span className="font-bold text-navy text-sm whitespace-nowrap">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
                <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-bold text-navy">Total</span>
              <span className="font-black text-xl text-navy">${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Section */}
      {showInvoiceSection && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Invoice</h2>
          {invoice ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Invoice #</span><span className="font-bold">{invoice.invoiceNumber}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Total</span><span className="font-black text-lg text-navy">${invoice.total.toFixed(2)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Status</span><StatusBadge status={invoice.status} /></div>
              </div>
              <div className="flex gap-2">
                <Link href={`/invoice/${invoice.id}`} target="_blank"
                  className="flex-1 bg-navy text-white font-bold py-3 rounded-xl text-center text-sm">
                  View Invoice
                </Link>
                <a href={`/api/admin/invoices/${invoice.id}/pdf`} target="_blank"
                  className="flex-1 bg-gray-100 text-navy font-bold py-3 rounded-xl text-center text-sm">
                  Download PDF
                </a>
              </div>
              <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl text-sm">
                📤 Send Invoice (Phase 2)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Job is complete. Generate invoice from {items.length} item(s) totaling ${total.toFixed(2)}.</p>
              <button onClick={generateInvoice} disabled={generatingInvoice || items.length === 0}
                className="w-full bg-amber text-white font-black py-4 rounded-xl text-lg disabled:opacity-50 active:scale-95 transition-transform">
                {generatingInvoice ? "Generating..." : "🧾 Generate Invoice"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Google Review Prompt */}
      {showReviewPrompt && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">⭐ Google Review</h2>
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700 leading-relaxed">{reviewMessage}</p>
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => copyToClipboard(reviewMessage, "review")}
              className="flex-1 bg-amber text-white font-bold py-2 rounded-lg text-sm active:scale-95">
              {copied === "review" ? "✓ Copied!" : "Copy Message"}
            </button>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={job.googleReviewSent}
              onChange={e => toggleReviewSent(e.target.checked)}
              className="w-5 h-5 accent-amber" />
            <span className="text-sm text-gray-700">Mark Review Sent</span>
          </label>
        </div>
      )}

      {/* Tracking Link */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">📱 Customer Tracking Link</h2>
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-mono text-gray-600 break-all">{trackUrl}</p>
        </div>
        <button onClick={() => copyToClipboard(trackUrl, "track")}
          className="w-full bg-gray-100 text-navy font-bold py-3 rounded-xl text-sm active:scale-95">
          {copied === "track" ? "✓ Copied!" : "Copy Tracking Link"}
        </button>
      </div>
    </div>
  );
}
