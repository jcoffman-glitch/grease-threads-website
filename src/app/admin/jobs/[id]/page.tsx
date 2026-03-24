"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Job, JobItem, Invoice, PriceListItem } from "@/lib/types";

const V2_STATUSES = ["New", "Scheduled", "En Route", "On Scene", "Complete", "Invoiced", "Paid"] as const;
const STATUS_COLORS: Record<string, string> = {
  New: "bg-gray-200 text-gray-800",
  Scheduled: "bg-blue-200 text-blue-800",
  "En Route": "bg-yellow-200 text-yellow-800",
  "On Scene": "bg-orange-200 text-orange-800",
  Complete: "bg-green-200 text-green-800",
  Invoiced: "bg-purple-200 text-purple-800",
  Paid: "bg-teal-200 text-teal-800",
  // Legacy
  Lead: "bg-gray-200 text-gray-800",
  Called: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-700",
};
const EQUIPMENT_TYPES = ["HVAC", "Appliance", "Commercial Kitchen", "Handyman", "Warranty"];
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJaxfsFK2hhkYRlSUOXJr5gfk";

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function WorkOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [items, setItems] = useState<JobItem[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unitPrice: 0, itemType: "Labor" });
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [priceSearch, setPriceSearch] = useState("");
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const [jobRes, invs, plist] = await Promise.all([
        fetch(`/api/admin/jobs/${id}`).then(r => r.ok ? r.json() : null),
        fetch("/api/admin/invoices").then(r => r.json()).catch(() => []),
        fetch("/api/admin/price-list").then(r => r.json()).catch(() => []),
      ]);
      if (!jobRes) { router.push("/admin/jobs"); return; }
      setJob(jobRes);
      setPriceList(Array.isArray(plist) ? plist : []);

      const jobItems = await fetch(`/api/admin/jobs/${id}/items`).then(r => r.json()).catch(() => []);
      setItems(Array.isArray(jobItems) ? jobItems : []);

      const foundInvoice = Array.isArray(invs) ? invs.find((i: Invoice) => i.jobId === id) : null;
      setInvoice(foundInvoice || null);
    } catch {
      router.push("/admin/jobs");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  // Auto-save with debounce
  function autoSave(updates: Partial<Job>) {
    const newJob = { ...job, ...updates } as Job;
    setJob(newJob);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveJob(updates), 1000);
  }

  async function saveJob(updates: Partial<Job>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, id }),
      });
      const updated = await res.json();
      setJob(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!job) return;
    // Log notification stub
    console.log(`[Notification] Status changed to ${newStatus} for job ${job.jobNumber}`);
    if (newStatus === "En Route") console.log(`[Notification] Customer ${job.customerName}: Technician is en route`);
    if (newStatus === "On Scene") console.log(`[Notification] Customer ${job.customerName}: Technician arrived`);
    if (newStatus === "Complete") console.log(`[Notification] Customer ${job.customerName}: Work complete`);

    const res = await fetch(`/api/admin/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setJob(updated);
    // Toast notification
    const toastMessages: Record<string, string> = {
      "New": "Job marked as New",
      "Scheduled": "Job scheduled",
      "En Route": "En route — customer notified",
      "On Scene": "On scene — customer notified",
      "Complete": "Job complete — ready for invoice",
      "Invoiced": "Invoice generated",
      "Paid": "Payment received!",
    };
    toast.success(toastMessages[newStatus] || `Status: ${newStatus}`);
  }

  async function fetchAiSuggestions() {
    if (!job) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: job.problemDescription,
          equipmentType: job.equipmentType || job.serviceType,
          modelNumber: job.modelNumber || "",
        }),
      });
      const data = await res.json();
      const suggestions = data.suggestions || "No suggestions available at this time.";
      setJob(prev => prev ? { ...prev, aiSuggestions: suggestions } : prev);
      // Cache in DB
      await fetch("/api/admin/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, aiSuggestions: suggestions }),
      });
    } catch {
      setJob(prev => prev ? { ...prev, aiSuggestions: "Failed to generate suggestions. Try again later." } : prev);
    } finally {
      setAiLoading(false);
    }
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
    setPriceSearch("");
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
      <div className="text-center"><div className="text-4xl mb-2">🔧</div><p className="text-gray-500">Loading work order...</p></div>
    </div>
  );

  if (!job) return null;

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const showInvoiceBtn = job.status === "Complete" || job.status === "Completed";
  const showInvoiceSection = ["Complete", "Completed", "Invoiced", "Paid"].includes(job.status);
  const showReviewPrompt = ["Complete", "Completed", "Paid"].includes(job.status);
  const reviewMessage = `Hi ${job.customerName}! Thanks for calling Grease & Threads. If you have a moment, a Google review really helps: ${GOOGLE_REVIEW_URL} — Thanks! -Joe`;
  const trackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/track/${job.trackingToken}`
    : `/track/${job.trackingToken}`;

  const filteredPriceList = priceSearch
    ? priceList.filter(p => p.name.toLowerCase().includes(priceSearch.toLowerCase()))
    : priceList;

  // Map legacy statuses to v2 for the status bar display
  function getDisplayStatus(s: string): string {
    if (s === "Lead") return "New";
    if (s === "In Progress") return "On Scene";
    if (s === "Completed") return "Complete";
    return s;
  }
  const displayStatus = getDisplayStatus(job.status);

  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* Back */}
      <div className="mb-3">
        <Link href="/admin/jobs" className="text-blue-600 text-sm flex items-center gap-1">
          ← All Jobs
        </Link>
      </div>

      {/* Status Bar */}
      <div data-testid="status-bar" className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {V2_STATUSES.map((s, i) => {
            const isActive = displayStatus === s;
            const isPast = V2_STATUSES.indexOf(displayStatus as typeof V2_STATUSES[number]) > i;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex-shrink-0 ${
                  isActive
                    ? STATUS_COLORS[s] + " ring-2 ring-offset-1 ring-amber"
                    : isPast
                    ? "bg-gray-100 text-gray-500 line-through"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header - Customer Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-400 font-mono">{job.jobNumber}</p>
            <h1 className="text-xl font-black text-navy">{job.customerName}</h1>
          </div>
          <StatusPill status={job.status} />
        </div>
        <div className="space-y-2">
          <a href={`tel:${job.customerPhone}`}
            className="flex items-center gap-2 text-blue-600 font-semibold text-lg py-2 active:bg-blue-50 rounded-lg -mx-2 px-2">
            📞 {job.customerPhone}
          </a>
          {job.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 py-2 active:bg-blue-50 rounded-lg -mx-2 px-2">
              📍 {job.address}
            </a>
          )}
          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
            <span>{job.serviceType}</span>
            <span>·</span>
            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Job Description + Equipment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Job Details</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <textarea
              value={job.problemDescription || ""}
              onChange={e => autoSave({ problemDescription: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none"
              placeholder="Describe the issue..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Equipment Type</label>
            <select
              value={job.equipmentType || ""}
              onChange={e => autoSave({ equipmentType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Select equipment type</option>
              {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Model Number</label>
            <div className="flex gap-2">
              <input
                value={job.modelNumber || ""}
                onChange={e => autoSave({ modelNumber: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2.5 text-sm"
                placeholder="Brand / model number"
              />
              {job.modelNumber && (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent((job.modelNumber || "") + " service manual")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-navy text-white px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap active:scale-95"
                >
                  Find Manual
                </a>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Scheduled</label>
            <input
              type="datetime-local"
              value={job.scheduledAt?.slice(0, 16) || ""}
              onChange={e => autoSave({ scheduledAt: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Assigned To</label>
            <select
              value={job.assignedTo || ""}
              onChange={e => autoSave({ assignedTo: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Unassigned</option>
              <option value="joe">Joe</option>
              <option value="anthoney">Anthoney</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
        <button
          onClick={() => setAiOpen(!aiOpen)}
          className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50"
        >
          <span className="font-bold text-navy text-sm uppercase tracking-wide">🤖 AI Diagnostics</span>
          <span className="text-gray-400 text-lg">{aiOpen ? "▲" : "▼"}</span>
        </button>
        {aiOpen && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <p className="text-xs text-amber-600 font-medium mt-3 mb-2">AI Suggestions — verify with your own diagnosis</p>
            {job.aiSuggestions ? (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {job.aiSuggestions}
              </div>
            ) : aiLoading ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                <div className="animate-spin inline-block w-5 h-5 border-2 border-amber border-t-transparent rounded-full mb-2" />
                <p>Generating suggestions...</p>
              </div>
            ) : (
              <button
                onClick={fetchAiSuggestions}
                className="w-full bg-amber/10 text-amber-700 font-semibold py-3 rounded-lg text-sm active:scale-95"
              >
                Generate AI Suggestions
              </button>
            )}
            {job.aiSuggestions && (
              <button
                onClick={fetchAiSuggestions}
                className="w-full mt-2 text-xs text-gray-400 py-1"
              >
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Parts & Labor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide">Parts & Labor</h2>
          <button onClick={() => setAddingItem(!addingItem)}
            className="bg-amber text-white text-sm font-semibold px-4 py-2.5 rounded-lg active:scale-95 min-h-[44px]">
            + Add Item
          </button>
        </div>

        {addingItem && (
          <form onSubmit={addItem} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div>
              <input
                type="text"
                placeholder="Search price list..."
                value={priceSearch}
                onChange={e => setPriceSearch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm mb-2"
              />
              <select
                value={newItem.itemType}
                onChange={e => {
                  const pl = priceList.find(p => p.name === e.target.value);
                  if (pl) {
                    setNewItem(n => ({ ...n, itemType: e.target.value, description: pl.name, unitPrice: pl.defaultPrice }));
                  } else {
                    setNewItem(n => ({ ...n, itemType: e.target.value }));
                  }
                  setPriceSearch("");
                }}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                size={Math.min(filteredPriceList.length + 3, 6)}
              >
                <option value="">— Select from price list —</option>
                {filteredPriceList.map(p => (
                  <option key={p.id} value={p.name}>{p.name} (${p.defaultPrice})</option>
                ))}
                <option value="Labor">Custom Labor</option>
                <option value="Part">Custom Part</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <input placeholder="Description" required value={newItem.description}
              onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Qty</label>
                <input type="number" min="0.01" step="0.01" value={newItem.quantity}
                  onChange={e => setNewItem(n => ({ ...n, quantity: parseFloat(e.target.value) || 1 }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Unit Price</label>
                <input type="number" min="0" step="0.01" value={newItem.unitPrice}
                  onChange={e => setNewItem(n => ({ ...n, unitPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-amber text-white font-bold py-3 rounded-lg text-sm min-h-[44px] active:scale-95">Add</button>
              <button type="button" onClick={() => { setAddingItem(false); setPriceSearch(""); }} className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg text-sm min-h-[44px]">Cancel</button>
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No items yet — tap Add Item to log parts & labor</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-3 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{item.description}</p>
                  <p className="text-xs text-gray-400">{item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                </div>
                <span className="font-bold text-navy text-sm whitespace-nowrap">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
                <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 text-2xl leading-none p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">×</button>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="font-bold text-navy">Total</span>
              <span className="font-black text-xl text-navy">${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Internal Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-2">Internal Notes</h2>
        <textarea
          value={job.notes || ""}
          onChange={e => autoSave({ notes: e.target.value })}
          rows={3}
          className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none"
          placeholder="Internal notes (not shown to customer)..."
        />
      </div>

      {/* Flags */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Flags</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 py-1 cursor-pointer">
            <input type="checkbox" checked={job.warrantyFlag || false}
              onChange={e => autoSave({ warrantyFlag: e.target.checked })}
              className="w-5 h-5 accent-amber" />
            <span className="text-sm text-gray-700">Rely Home Warranty</span>
          </label>
          <label className="flex items-center gap-3 py-1 cursor-pointer">
            <input type="checkbox" checked={job.subscriptionFlag || false}
              onChange={e => autoSave({ subscriptionFlag: e.target.checked })}
              className="w-5 h-5 accent-amber" />
            <span className="text-sm text-gray-700">Subscription Visit</span>
          </label>
          <label className="flex items-center gap-3 py-1 cursor-pointer">
            <input type="checkbox" checked={job.followUpRequired || false}
              onChange={e => autoSave({ followUpRequired: e.target.checked })}
              className="w-5 h-5 accent-amber" />
            <span className="text-sm text-gray-700">Follow-up Required</span>
          </label>
        </div>
      </div>

      {/* Warranty Fields (shown when warranty flag is checked) */}
      {job.warrantyFlag && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-4 mb-3">
          <h2 className="font-bold text-purple-700 text-sm uppercase tracking-wide mb-3">Warranty Details</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Authorization Number</label>
              <input value={job.warrantyAuthNumber || ""}
                onChange={e => autoSave({ warrantyAuthNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Auth #" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Warranty Company Contact</label>
              <input value={job.warrantyContact || ""}
                onChange={e => autoSave({ warrantyContact: e.target.value })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Contact info" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Coverage</label>
              <select value={job.warrantyCovered || ""}
                onChange={e => autoSave({ warrantyCovered: e.target.value })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm">
                <option value="">Not determined</option>
                <option value="covered">Covered</option>
                <option value="not_covered">Not Covered</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Reimbursement Amount</label>
              <input type="number" min="0" step="0.01" value={job.warrantyReimbursement || ""}
                onChange={e => autoSave({ warrantyReimbursement: parseFloat(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="$0.00" />
            </div>
          </div>
        </div>
      )}

      {/* Invoice Section */}
      {showInvoiceSection && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Invoice</h2>
          {invoice ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Invoice #</span><span className="font-bold">{invoice.invoiceNumber}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Total</span><span className="font-black text-lg text-navy">${invoice.total.toFixed(2)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Status</span><StatusPill status={invoice.status} /></div>
              </div>
              <div className="flex gap-2">
                <Link href={`/invoice/${invoice.id}`} target="_blank"
                  className="flex-1 bg-navy text-white font-bold py-3 rounded-xl text-center text-sm min-h-[44px] flex items-center justify-center">
                  View Invoice
                </Link>
                <a href={`/api/admin/invoices/${invoice.id}/pdf`} target="_blank"
                  className="flex-1 bg-gray-100 text-navy font-bold py-3 rounded-xl text-center text-sm min-h-[44px] flex items-center justify-center">
                  PDF
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Job complete. Generate invoice from {items.length} item(s) totaling ${total.toFixed(2)}.</p>
              <button onClick={generateInvoice} disabled={generatingInvoice || items.length === 0}
                className="w-full bg-amber text-white font-black py-4 rounded-xl text-lg disabled:opacity-50 active:scale-95 min-h-[56px]">
                {generatingInvoice ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Google Review Prompt */}
      {showReviewPrompt && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Google Review</h2>
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700 leading-relaxed">{reviewMessage}</p>
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => copyToClipboard(reviewMessage, "review")}
              className="flex-1 bg-amber text-white font-bold py-2.5 rounded-lg text-sm active:scale-95 min-h-[44px]">
              {copied === "review" ? "Copied!" : "Copy Message"}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Customer Tracking Link</h2>
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-mono text-gray-600 break-all">{trackUrl}</p>
        </div>
        <button onClick={() => copyToClipboard(trackUrl, "track")}
          className="w-full bg-gray-100 text-navy font-bold py-3 rounded-xl text-sm active:scale-95 min-h-[44px]">
          {copied === "track" ? "Copied!" : "Copy Tracking Link"}
        </button>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-pb md:left-64">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <span className={`text-xs self-center px-2 py-1 rounded ${saving ? "bg-amber/20 text-amber-700" : "bg-green-100 text-green-700"}`}>
            {saving ? "Saving..." : "Saved"}
          </span>
          <a href={`tel:${job.customerPhone}`}
            className="bg-navy text-white font-bold py-3 px-4 rounded-xl text-sm active:scale-95 min-h-[44px] flex items-center gap-1">
            📞 Call
          </a>
          {showInvoiceBtn && !invoice && (
            <button onClick={generateInvoice} disabled={generatingInvoice || items.length === 0}
              className="flex-1 bg-amber text-white font-black py-3 rounded-xl text-sm disabled:opacity-50 active:scale-95 min-h-[44px]">
              {generatingInvoice ? "..." : "Generate Invoice"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
