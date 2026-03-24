"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Job, JobItem, Invoice, PriceListItem } from "@/lib/types";

const V3_STATUSES = ["Lead", "Work Order", "En Route", "Working", "Job Done", "Final Invoice", "Payment", "Review"] as const;

const STATUS_COLORS: Record<string, string> = {
  Lead: "bg-gray-200 text-gray-800",
  "Work Order": "bg-blue-200 text-blue-800",
  "En Route": "bg-yellow-200 text-yellow-800",
  Working: "bg-orange-200 text-orange-800",
  "Job Done": "bg-green-200 text-green-800",
  "Final Invoice": "bg-purple-200 text-purple-800",
  Payment: "bg-teal-200 text-teal-800",
  Review: "bg-indigo-200 text-indigo-800",
};

const EQUIPMENT_TYPES = ["HVAC", "Appliance", "Commercial Kitchen", "Handyman", "Warranty"];
const LEAD_SOURCES: Record<string, string> = {
  direct: "Direct Call",
  facebook: "Facebook",
  google_search: "Google Search",
  google_maps: "Google Maps",
  referral: "Referral",
  website: "Website Contact Form",
  other: "Other",
};
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJaxfsFK2hhkYRlSUOXJr5gfk";

/** Map legacy statuses to v3 pipeline for display */
function mapStatus(s: string): string {
  switch (s) {
    case "Called":
    case "Scheduled":
    case "New":
      return "Work Order";
    case "In Progress":
    case "On Scene":
      return "Working";
    case "Completed":
    case "Complete":
      return "Job Done";
    case "Invoiced":
      return "Final Invoice";
    case "Paid":
      return "Payment";
    default:
      return s;
  }
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
  const [dirty, setDirty] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unitPrice: 0, itemType: "Labor" });
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [warrantyOpen, setWarrantyOpen] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [priceSearch, setPriceSearch] = useState("");
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRate, setTaxRate] = useState(7);
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

  function autoSave(updates: Partial<Job>) {
    const newJob = { ...job, ...updates } as Job;
    setJob(newJob);
    setDirty(true);
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
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    if (!job) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...job, id }),
      });
      const updated = await res.json();
      setJob(updated);
      setDirty(false);
      toast.success("Saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!job) return;
    const currentIdx = V3_STATUSES.indexOf(mapStatus(job.status) as typeof V3_STATUSES[number]);
    const newIdx = V3_STATUSES.indexOf(newStatus as typeof V3_STATUSES[number]);
    const isBackward = newIdx < currentIdx;

    const message = isBackward
      ? `Move back to ${newStatus}? This may undo notifications.`
      : `Advance to ${newStatus}?`;

    if (!confirm(message)) return;

    console.log(`[Notification] Status changed to ${newStatus} for job ${job.jobNumber}`);
    if (newStatus === "En Route") console.log(`[Notification] Customer ${job.customerName}: Technician is en route`);
    if (newStatus === "Working") console.log(`[Notification] Customer ${job.customerName}: Technician arrived`);
    if (newStatus === "Job Done") console.log(`[Notification] Customer ${job.customerName}: Work complete`);

    const res = await fetch(`/api/admin/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setJob(updated);

    const toastMessages: Record<string, string> = {
      Lead: "Job marked as Lead",
      "Work Order": "Work order created",
      "En Route": "En route — customer notified",
      Working: "Working — customer notified",
      "Job Done": "Job complete — ready for invoice",
      "Final Invoice": "Invoice step",
      Payment: "Payment received!",
      Review: "Ready for review",
    };
    toast.success(toastMessages[newStatus] || `Status: ${newStatus}`);
  }

  async function fetchAiSuggestions() {
    if (!job) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${id}/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: job.problemDescription,
          equipmentType: job.equipmentType || job.serviceType,
          modelNumber: job.modelNumber || "",
        }),
      });
      const data = await res.json();
      const suggestions = data.suggestions || [];
      const suggestionsStr = Array.isArray(suggestions) ? suggestions.join("\n") : suggestions;
      setJob(prev => prev ? { ...prev, aiSuggestions: suggestionsStr } : prev);
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
    setJob(prev => prev ? { ...prev, status: "Final Invoice" as Job["status"] } : prev);
    setGeneratingInvoice(false);
    toast.success("Invoice generated!");
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center"><p className="text-gray-500">Loading work order...</p></div>
    </div>
  );

  if (!job) return null;

  const displayStatus = mapStatus(job.status);
  const currentIdx = V3_STATUSES.indexOf(displayStatus as typeof V3_STATUSES[number]);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxAmount = includeTax ? subtotal * (taxRate / 100) : 0;
  const grandTotal = subtotal + taxAmount;
  const showInvoiceBtn = displayStatus === "Job Done";
  const showPaymentReview = displayStatus === "Payment";
  const reviewMessage = `Hi ${job.customerName}! Thanks for calling Grease & Threads. If you have a moment, a Google review really helps: ${GOOGLE_REVIEW_URL} — Thanks! -Joe`;

  const filteredPriceList = priceSearch
    ? priceList.filter(p => p.name.toLowerCase().includes(priceSearch.toLowerCase()))
    : priceList;

  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* 1. Top bar (sticky) */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 -mx-4 px-4 py-2 flex items-center gap-3 mb-3">
        <Link href="/admin/jobs" className="text-blue-600 text-lg p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          ←
        </Link>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-xs text-gray-400 font-mono">{job.jobNumber}</p>
          <h1 className="text-base font-bold text-navy truncate">{job.customerName}</h1>
        </div>
        <button
          onClick={saveAll}
          className="relative bg-navy text-white font-semibold px-4 py-2 rounded-lg text-sm active:scale-95 min-h-[44px]"
        >
          Save
          {dirty && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber rounded-full border-2 border-white" />}
        </button>
      </div>

      {/* 2. Status Pipeline Bar */}
      <div data-testid="status-bar" className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {V3_STATUSES.map((s, i) => {
            const isActive = displayStatus === s;
            const isPast = currentIdx > i;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex-shrink-0 ${
                  isActive
                    ? (STATUS_COLORS[s] || "bg-gray-200 text-gray-800") + " ring-2 ring-offset-1 ring-navy"
                    : isPast
                    ? "bg-gray-100 text-gray-500"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {isPast && "✓ "}{s}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Customer Info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Customer</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <input
              value={job.customerName || ""}
              onChange={e => autoSave({ customerName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Phone</label>
            <a href={`tel:${job.customerPhone}`}
              className="flex items-center gap-2 text-blue-600 font-semibold text-lg py-2 active:bg-blue-50 rounded-lg -mx-2 px-2">
              {job.customerPhone}
            </a>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={job.customerEmail || ""}
              onChange={e => autoSave({ customerEmail: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
              placeholder="Email"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Address</label>
            <input
              value={job.address || ""}
              onChange={e => autoSave({ address: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
              placeholder="Service address"
            />
            {job.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-xs text-blue-600 font-medium"
              >
                Open in Maps
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 4. Job Details card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Job Details</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Service Type</label>
            <select
              value={job.serviceType || ""}
              onChange={e => autoSave({ serviceType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="HVAC">HVAC</option>
              <option value="Appliance Repair">Appliance Repair</option>
              <option value="Commercial Kitchen">Commercial Kitchen</option>
              <option value="Handyman">Handyman</option>
              <option value="Other">Other</option>
            </select>
          </div>
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
                  className="bg-navy text-white px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap active:scale-95 min-h-[44px] flex items-center"
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
            <label className="text-xs text-gray-500 block mb-1">Lead Source</label>
            <p className="text-sm text-gray-700 px-1">{LEAD_SOURCES[job.leadSource || ""] || job.leadSource || "—"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Internal Notes</label>
            <textarea
              value={job.notes || ""}
              onChange={e => autoSave({ notes: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none"
              placeholder="Internal notes (not shown to customer)..."
            />
          </div>
          {/* Flags */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
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
      </div>

      {/* 5. AI Diagnostic Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
        <button
          onClick={() => setAiOpen(!aiOpen)}
          className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50"
        >
          <span className="font-bold text-navy text-sm uppercase tracking-wide">AI Suggestions — verify with your own diagnosis</span>
          <span className="text-gray-400 text-lg">{aiOpen ? "▲" : "▼"}</span>
        </button>
        {aiOpen && (
          <div className="px-4 pb-4 border-t border-gray-100">
            {job.aiSuggestions ? (
              <div className="bg-gray-50 rounded-lg p-3 mt-3 text-sm text-gray-700">
                <ul className="list-disc list-inside space-y-1">
                  {job.aiSuggestions.split("\n").filter(Boolean).map((line, i) => (
                    <li key={i}>{line.replace(/^[-•*]\s*/, "")}</li>
                  ))}
                </ul>
              </div>
            ) : aiLoading ? (
              <div className="bg-gray-50 rounded-lg p-4 mt-3 text-center text-sm text-gray-500">
                <div className="animate-spin inline-block w-5 h-5 border-2 border-amber border-t-transparent rounded-full mb-2" />
                <p>Generating suggestions...</p>
              </div>
            ) : (job.problemDescription || job.modelNumber) ? (
              <button
                onClick={fetchAiSuggestions}
                className="w-full mt-3 bg-amber/10 text-amber-700 font-semibold py-3 rounded-lg text-sm active:scale-95 min-h-[44px]"
              >
                Get AI Suggestions
              </button>
            ) : (
              <p className="text-xs text-gray-400 mt-3">Add a problem description or model number to get AI suggestions.</p>
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

      {/* 6. Parts & Labor */}
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
              {filteredPriceList.length > 0 && (
                <select
                  onChange={e => {
                    const pl = priceList.find(p => p.name === e.target.value);
                    if (pl) {
                      setNewItem(n => ({ ...n, description: pl.name, unitPrice: pl.defaultPrice, itemType: pl.itemType || "Labor" }));
                    }
                    e.target.value = "";
                    setPriceSearch("");
                  }}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="">Quick add from price list...</option>
                  {filteredPriceList.map(p => (
                    <option key={p.id} value={p.name}>{p.name} (${p.defaultPrice})</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select
                value={newItem.itemType}
                onChange={e => setNewItem(n => ({ ...n, itemType: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="Labor">Labor</option>
                <option value="Part">Part</option>
                <option value="Diagnostic Fee">Diagnostic Fee</option>
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
          <div>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 text-xs text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100">
              <span>Description</span>
              <span>Type</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Total</span>
              <span></span>
            </div>
            <div className="space-y-0">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{item.description}</p>
                    <p className="text-xs text-gray-400">{item.itemType} · {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-navy text-sm whitespace-nowrap">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                  <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 text-2xl leading-none p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="pt-3 border-t border-gray-200 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-navy">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={includeTax} onChange={e => setIncludeTax(e.target.checked)} className="accent-amber" />
                  Tax
                  {includeTax && (
                    <input type="number" min="0" max="100" step="0.1" value={taxRate}
                      onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-14 border rounded px-1 py-0.5 text-xs ml-1" />
                  )}
                  {includeTax && <span className="text-xs">%</span>}
                </label>
                {includeTax && <span className="font-medium text-navy">${taxAmount.toFixed(2)}</span>}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-bold text-navy">Total</span>
                <span className="font-black text-xl text-navy">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Rely Home Warranty Panel (only when flag checked) */}
      {job.warrantyFlag && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 overflow-hidden mb-3">
          <button
            onClick={() => setWarrantyOpen(!warrantyOpen)}
            className="w-full px-4 py-3 flex items-center justify-between active:bg-purple-50"
          >
            <span className="font-bold text-purple-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <span>🛡️</span> Rely Home Warranty
            </span>
            <span className="text-gray-400 text-lg">{warrantyOpen ? "▲" : "▼"}</span>
          </button>
          {warrantyOpen && (
            <div className="px-4 pb-4 border-t border-purple-100 space-y-3 pt-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Rely Work Order #</label>
                <input value={job.warrantyWorkOrderNumber || ""}
                  onChange={e => autoSave({ warrantyWorkOrderNumber: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Rely dispatch ID" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Authorization Status</label>
                <select value={job.warrantyAuthStatus || ""}
                  onChange={e => autoSave({ warrantyAuthStatus: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                  <option value="reassigned">Re-assigned</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Authorization #</label>
                <input value={job.warrantyAuthNumber || ""}
                  onChange={e => autoSave({ warrantyAuthNumber: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Auth #" />
                <p className="text-xs text-amber-600 mt-1 font-medium">Save this before doing the work</p>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 py-1 cursor-pointer">
                  <input type="checkbox" checked={job.deductibleCollected || false}
                    onChange={e => autoSave({ deductibleCollected: e.target.checked })}
                    className="w-5 h-5 accent-purple-600" />
                  <span className="text-sm text-gray-700">Deductible Collected</span>
                </label>
                {job.deductibleCollected && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Deductible Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                      <input type="number" min="0" step="0.01" value={job.deductibleAmount || ""}
                        onChange={e => autoSave({ deductibleAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full border rounded-lg pl-7 pr-3 py-2.5 text-sm" placeholder="0.00" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Billing Entity</label>
                <input value={job.warrantyBillingEntity ?? "Rely Home Warranty"}
                  onChange={e => autoSave({ warrantyBillingEntity: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Rely Invoice Status</label>
                <select value={job.warrantyInvoiceStatus || "not_submitted"}
                  onChange={e => autoSave({ warrantyInvoiceStatus: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="not_submitted">Not Submitted</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Rely Reimbursement Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={job.warrantyReimbursement || ""}
                    onChange={e => autoSave({ warrantyReimbursement: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg pl-7 pr-3 py-2.5 text-sm" placeholder="0.00" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice Section (when invoice exists) */}
      {invoice && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Invoice</h2>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Invoice #</span><span className="font-bold">{invoice.invoiceNumber}</span></div>
            <div className="flex justify-between mt-1"><span className="text-gray-500">Total</span><span className="font-black text-lg text-navy">${invoice.total.toFixed(2)}</span></div>
          </div>
          <div className="flex gap-2 mt-3">
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
      )}

      {/* Google Review Prompt (when Payment status) */}
      {showPaymentReview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Google Review</h2>
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700 leading-relaxed">{reviewMessage}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(reviewMessage);
              toast.success("Review message copied!");
            }}
            className="w-full bg-amber text-white font-bold py-2.5 rounded-lg text-sm active:scale-95 min-h-[44px]"
          >
            Copy Review Message
          </button>
        </div>
      )}

      {/* 8. Sticky bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-pb md:left-64">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={saveAll}
            className="relative bg-navy text-white font-bold py-3 px-4 rounded-xl text-sm active:scale-95 min-h-[44px]"
          >
            Save
            {dirty && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber rounded-full border-2 border-white" />}
          </button>
          <a href={`tel:${job.customerPhone}`}
            className="bg-gray-100 text-navy font-bold py-3 px-4 rounded-xl text-sm active:scale-95 min-h-[44px] flex items-center gap-1">
            Call
          </a>
          {showInvoiceBtn && !invoice && (
            <button onClick={generateInvoice} disabled={generatingInvoice || items.length === 0}
              className="flex-1 bg-amber text-white font-black py-3 rounded-xl text-sm disabled:opacity-50 active:scale-95 min-h-[44px]">
              {generatingInvoice ? "Generating..." : "Generate Invoice"}
            </button>
          )}
          {displayStatus === "Review" && (
            <button
              onClick={() => toast.success("Marked as reviewed")}
              className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl text-sm active:scale-95 min-h-[44px]"
            >
              Mark as Reviewed
            </button>
          )}
          {invoice && (
            <Link href={`/invoice/${invoice.id}`} target="_blank"
              className="bg-purple-100 text-purple-700 font-bold py-3 px-4 rounded-xl text-sm min-h-[44px] flex items-center">
              View Invoice
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
