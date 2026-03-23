"use client";

import { useEffect, useState, useCallback } from "react";
import type { Job, JobItem, PriceListItem } from "@/lib/types";

const JOB_STATUSES = ["Lead", "Called", "Scheduled", "In Progress", "Completed", "Invoiced", "Paid"] as const;
const SERVICE_TYPES = ["HVAC", "Appliance Repair", "Commercial Kitchen", "Handyman", "Other"];
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJaxfsFK2hhkYRlSUOXJr5gfk";

const LEAD_SOURCES = [
  { value: "direct", label: "Direct Call" },
  { value: "facebook", label: "Facebook" },
  { value: "google_search", label: "Google Search" },
  { value: "google_maps", label: "Google Maps" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website Contact Form" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS: Record<string, string> = {
  Lead: "bg-gray-100 text-gray-700",
  Called: "bg-blue-100 text-blue-700",
  Scheduled: "bg-indigo-100 text-indigo-700",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-700",
  Invoiced: "bg-purple-100 text-purple-700",
  Paid: "bg-teal-100 text-teal-700",
};

const ITEM_TYPES = ["Labor", "Part", "Diagnostic Fee", "Other"] as const;

const emptyJob = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  serviceType: "HVAC",
  problemDescription: "",
  address: "",
  scheduledAt: "",
  status: "Lead" as const,
  notes: "",
  leadSource: "direct",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState<Partial<Job> | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jobItems, setJobItems] = useState<Record<string, JobItem[]>>({});
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<JobItem>>({ itemType: "Labor", quantity: 1, unitPrice: 0, description: "" });
  const [loading, setLoading] = useState(true);
  const [reviewCopied, setReviewCopied] = useState<string | null>(null);
  const [reviewSentIds, setReviewSentIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [reviewModal, setReviewModal] = useState<Job | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch("/api/admin/price-list").then((r) => r.json()),
    ]).then(([j, p]) => {
      setJobs(j);
      setPriceList(p);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadItems = useCallback(async (jobId: string) => {
    if (jobItems[jobId]) return;
    const items = await fetch(`/api/admin/jobs/${jobId}/items`).then((r) => r.json());
    setJobItems((prev) => ({ ...prev, [jobId]: items }));
  }, [jobItems]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      await loadItems(id);
    }
  };

  const filtered = jobs
    .filter((j) => filter === "All" || j.status === filter)
    .sort((a, b) => {
      if (sortBy === "status") return JOB_STATUSES.indexOf(a.status as never) - JOB_STATUSES.indexOf(b.status as never);
      return new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
    });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/jobs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const saved = await res.json();
    if (editing.id) {
      setJobs(jobs.map((j) => (j.id === saved.id ? saved : j)));
    } else {
      setJobs([saved, ...jobs]);
    }
    setEditing(null);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setJobs(jobs.map((j) => (j.id === id ? updated : j)));

    // Phase 4D: if just marked Paid and review not sent, show review modal
    if (status === "Paid") {
      const job = jobs.find((j) => j.id === id);
      if (job && !job.googleReviewSent && !reviewSentIds.has(id)) {
        setReviewModal({ ...updated });
      }
    }
  }

  async function markReviewSent(jobId: string) {
    const res = await fetch(`/api/admin/jobs/${jobId}/review-sent`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setJobs(jobs.map((j) => (j.id === jobId ? updated : j)));
      setReviewSentIds((prev) => new Set([...prev, jobId]));
      showToast("✅ Review request marked as sent!");
      setReviewModal(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this job?")) return;
    await fetch("/api/admin/jobs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setJobs(jobs.filter((j) => j.id !== id));
  }

  async function addItem(jobId: string) {
    if (!newItem.description) return;
    const res = await fetch(`/api/admin/jobs/${jobId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    const item = await res.json();
    setJobItems((prev) => ({ ...prev, [jobId]: [...(prev[jobId] || []), item] }));
    setNewItem({ itemType: "Labor", quantity: 1, unitPrice: 0, description: "" });
  }

  async function removeItem(jobId: string, itemId: string) {
    await fetch(`/api/admin/jobs/${jobId}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    });
    setJobItems((prev) => ({ ...prev, [jobId]: (prev[jobId] || []).filter((i) => i.id !== itemId) }));
  }

  async function generateInvoice(jobId: string) {
    setGeneratingInvoice(jobId);
    try {
      const res = await fetch(`/api/admin/invoices/${jobId}/generate`, { method: "POST" });
      const invoice = await res.json();
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: "Invoiced" } : j)));
      showToast(`Invoice ${invoice.invoiceNumber} created! Go to Invoices page to view.`, "info");
    } catch {
      showToast("Error generating invoice", "error");
    } finally {
      setGeneratingInvoice(null);
    }
  }

  function copyReviewRequest(job: Job) {
    const firstName = job.customerName.split(" ")[0];
    const msg = `Hi ${firstName}! Thanks for calling Grease & Threads. If you have a moment, a Google review really helps small businesses like mine: ${GOOGLE_REVIEW_URL} — Thanks! - Rick`;
    navigator.clipboard.writeText(msg).then(() => {
      setReviewCopied(job.id);
      setTimeout(() => setReviewCopied(null), 3000);
    });
  }

  async function sendEmail(jobId: string, template: string) {
    setEmailSending(`${jobId}-${template}`);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✉️ Email sent successfully!`);
      } else {
        showToast(data.reason || "Failed to send email", "error");
      }
    } catch {
      showToast("Error sending email", "error");
    } finally {
      setEmailSending(null);
    }
  }

  function applyPriceListItem(item: PriceListItem) {
    setNewItem({ ...newItem, description: item.name, unitPrice: item.defaultPrice, itemType: item.itemType as typeof newItem.itemType });
  }

  const itemTotal = (items: JobItem[]) => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  if (loading) return <div className="text-gray-500 p-4">Loading jobs...</div>;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-xs transition-all ${
          toast.type === "error" ? "bg-red-600" : toast.type === "info" ? "bg-blue-600" : "bg-green-600"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Phase 4D: Post-payment review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-3xl mb-3 text-center">⭐</div>
            <h2 className="text-xl font-bold text-navy text-center mb-2">Job Complete & Paid!</h2>
            <p className="text-gray-600 text-center mb-4">
              Don&apos;t forget to request a Google Review from <strong>{reviewModal.customerName}</strong>.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-green-700 italic">
                &quot;Hi {reviewModal.customerName.split(" ")[0]}! Thanks for calling Grease &amp; Threads. If you have a moment, a Google review really helps small businesses like mine: {GOOGLE_REVIEW_URL} — Thanks! - Rick&quot;
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { copyReviewRequest(reviewModal); }}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700"
              >
                {reviewCopied === reviewModal.id ? "✓ Copied!" : "📋 Copy Message"}
              </button>
              <button
                onClick={() => markReviewSent(reviewModal.id)}
                className="flex-1 py-2.5 bg-navy text-white rounded-lg font-medium text-sm hover:bg-navy/90"
              >
                ✅ Mark Sent
              </button>
              <button
                onClick={() => setReviewModal(null)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-300"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-navy">Job Tracker</h1>
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "status")} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700">
            <option value="date">Sort: Date</option>
            <option value="status">Sort: Status</option>
          </select>
          <button onClick={() => setEditing({ ...emptyJob })} className="px-4 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark text-sm font-medium">
            + New Job
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {["All", ...JOB_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? "bg-navy text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>
            {s} {s !== "All" && `(${jobs.filter((j) => j.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400">No jobs found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((job) => {
              const isExpanded = expandedId === job.id;
              const items = jobItems[job.id] || [];
              const total = itemTotal(items);
              const reviewAlreadySent = job.googleReviewSent || reviewSentIds.has(job.id);

              return (
                <div key={job.id} className="hover:bg-gray-50">
                  {/* Job row */}
                  <div className="flex items-center gap-2 px-4 py-3 cursor-pointer" onClick={() => toggleExpand(job.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-navy text-sm">{job.customerName}</span>
                        {job.jobNumber && <span className="text-xs text-gray-400">#{job.jobNumber}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700"}`}>{job.status}</span>
                        {(job.status === "Completed" || job.status === "Paid") && !reviewAlreadySent && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">⭐ Review pending</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{job.serviceType} · {job.customerPhone}</div>
                    </div>
                    <div className="hidden sm:block text-right text-xs text-gray-500">
                      <div>{new Date(job.createdAt || job.date || "").toLocaleDateString()}</div>
                      {total > 0 && <div className="font-medium text-gray-700">${total.toFixed(2)}</div>}
                    </div>
                    <span className="text-gray-400 text-sm ml-2">{isExpanded ? "▲" : "▼"}</span>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      {/* Job details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-sm">
                        <div><span className="text-gray-500">Problem:</span> <span className="text-gray-800">{job.problemDescription || job.notes || "—"}</span></div>
                        <div><span className="text-gray-500">Address:</span> <span className="text-gray-800">{job.address || "—"}</span></div>
                        <div><span className="text-gray-500">Email:</span> <span className="text-gray-800">{job.customerEmail || "—"}</span></div>
                        {job.scheduledAt && <div><span className="text-gray-500">Scheduled:</span> <span className="text-gray-800">{new Date(job.scheduledAt).toLocaleString()}</span></div>}
                        {job.trackingToken && (
                          <div><span className="text-gray-500">Track link:</span>{" "}
                            <a href={`/track/${job.trackingToken}`} target="_blank" className="text-blue-600 underline text-xs">
                              /track/{job.trackingToken}
                            </a>
                          </div>
                        )}
                        {job.leadSource && (
                          <div><span className="text-gray-500">Lead Source:</span> <span className="text-gray-800">{LEAD_SOURCES.find(l => l.value === job.leadSource)?.label || job.leadSource}</span></div>
                        )}
                      </div>

                      {/* Quick status buttons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.status !== "In Progress" && (
                          <button onClick={() => updateStatus(job.id, "In Progress")} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600">
                            ▶ Mark In Progress
                          </button>
                        )}
                        {job.status !== "Completed" && (
                          <button onClick={() => updateStatus(job.id, "Completed")} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                            ✓ Mark Complete
                          </button>
                        )}
                        {job.status !== "Paid" && (
                          <button onClick={() => updateStatus(job.id, "Paid")} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700">
                            💰 Mark Paid
                          </button>
                        )}
                        <button onClick={() => generateInvoice(job.id)} disabled={generatingInvoice === job.id}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50">
                          {generatingInvoice === job.id ? "Generating..." : "🧾 Generate Invoice"}
                        </button>
                        <button onClick={() => setEditing({ ...job })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                          ✏️ Edit Job
                        </button>
                        <button onClick={() => remove(job.id)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                          🗑 Delete
                        </button>
                      </div>

                      {/* Email buttons (Phase 4B) */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-blue-800 mb-2">✉️ Email Customer</p>
                        <div className="flex flex-wrap gap-2">
                          {job.status === "Scheduled" && (
                            <button
                              onClick={() => sendEmail(job.id, "confirmation")}
                              disabled={emailSending === `${job.id}-confirmation`}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              {emailSending === `${job.id}-confirmation` ? "Sending..." : "📅 Send Confirmation"}
                            </button>
                          )}
                          {(job.status === "Invoiced" || job.status === "Paid") && (
                            <button
                              onClick={() => sendEmail(job.id, "invoice")}
                              disabled={emailSending === `${job.id}-invoice`}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                            >
                              {emailSending === `${job.id}-invoice` ? "Sending..." : "🧾 Send Invoice"}
                            </button>
                          )}
                          <button
                            onClick={() => sendEmail(job.id, "followup")}
                            disabled={emailSending === `${job.id}-followup`}
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
                          >
                            {emailSending === `${job.id}-followup` ? "Sending..." : "🔄 Send Follow-up"}
                          </button>
                        </div>
                        {!job.customerEmail && (
                          <p className="text-xs text-blue-500 mt-1.5">⚠️ No email on file — add one to enable email features</p>
                        )}
                      </div>

                      {/* Google Review prompt (Phase 4A) */}
                      {(job.status === "Completed" || job.status === "Paid") && (
                        <div className={`border rounded-lg p-3 mb-4 ${reviewAlreadySent ? "bg-gray-50 border-gray-200" : "bg-green-50 border-green-200"}`}>
                          <p className={`text-xs font-medium mb-1 ${reviewAlreadySent ? "text-gray-500" : "text-green-800"}`}>
                            {reviewAlreadySent ? "✅ Review request sent" : "📬 Send Google Review Request"}
                          </p>
                          {!reviewAlreadySent && (
                            <>
                              <p className="text-xs text-green-700 mb-2 italic">
                                &quot;Hi {job.customerName.split(" ")[0]}! Thanks for calling Grease &amp; Threads. If you have a moment, a Google review really helps small businesses like mine: {GOOGLE_REVIEW_URL} — Thanks! - Rick&quot;
                              </p>
                              <div className="flex gap-2">
                                <button onClick={() => copyReviewRequest(job)}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                                  {reviewCopied === job.id ? "✓ Copied!" : "📋 Copy Review Request"}
                                </button>
                                <button onClick={() => markReviewSent(job.id)}
                                  className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700">
                                  ✅ Mark Review Sent
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Line items */}
                      <div className="mt-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Line Items</h4>
                        {items.length > 0 ? (
                          <table className="w-full text-xs mb-3">
                            <thead>
                              <tr className="text-gray-400 text-left">
                                <th className="py-1">Description</th>
                                <th className="py-1">Type</th>
                                <th className="py-1 text-right">Qty</th>
                                <th className="py-1 text-right">Price</th>
                                <th className="py-1 text-right">Total</th>
                                <th className="py-1"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => (
                                <tr key={item.id} className="border-t border-gray-100">
                                  <td className="py-1.5">{item.description}</td>
                                  <td className="py-1.5 text-gray-500">{item.itemType}</td>
                                  <td className="py-1.5 text-right">{item.quantity}</td>
                                  <td className="py-1.5 text-right">${item.unitPrice.toFixed(2)}</td>
                                  <td className="py-1.5 text-right font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                  <td className="py-1.5 pl-2">
                                    <button onClick={() => removeItem(job.id, item.id)} className="text-red-400 hover:text-red-600">✕</button>
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t border-gray-200 font-semibold">
                                <td colSpan={4} className="py-1.5 text-right text-gray-700">Total:</td>
                                <td className="py-1.5 text-right text-navy">${total.toFixed(2)}</td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-xs text-gray-400 mb-3">No line items yet</p>
                        )}

                        {/* Quick-add from price list */}
                        {priceList.length > 0 && (
                          <div className="mb-2">
                            <select onChange={(e) => {
                              const pl = priceList.find((p) => p.id === e.target.value);
                              if (pl) applyPriceListItem(pl);
                              e.target.value = "";
                            }} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-700">
                              <option value="">Quick-add from price list...</option>
                              {priceList.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} — ${(p.defaultPrice || p.price || 0).toFixed(2)}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Add item form */}
                        <div className="flex flex-wrap gap-2">
                          <select value={newItem.itemType} onChange={(e) => setNewItem({ ...newItem, itemType: e.target.value as typeof newItem.itemType })}
                            className="px-2 py-1.5 border border-gray-200 rounded text-xs">
                            {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                          <input placeholder="Description" value={newItem.description || ""} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            className="flex-1 min-w-[120px] px-2 py-1.5 border border-gray-200 rounded text-xs" />
                          <input type="number" placeholder="Qty" value={newItem.quantity || 1} onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded text-xs" />
                          <input type="number" placeholder="Price" value={newItem.unitPrice || 0} onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 border border-gray-200 rounded text-xs" />
                          <button onClick={() => addItem(job.id)} className="px-3 py-1.5 bg-navy text-white rounded text-xs font-medium hover:bg-navy/90">
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New/Edit Job Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg font-bold text-navy mb-5">{editing.id ? "Edit Job" : "New Job"}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer Name" value={editing.customerName || ""} onChange={(v) => setEditing({ ...editing, customerName: v })} required />
                <Field label="Phone" type="tel" value={editing.customerPhone || editing.phone || ""} onChange={(v) => setEditing({ ...editing, customerPhone: v, phone: v })} required />
              </div>
              <Field label="Email (optional)" type="email" value={editing.customerEmail || ""} onChange={(v) => setEditing({ ...editing, customerEmail: v })} />
              <Field label="Address (optional)" value={editing.address || ""} onChange={(v) => setEditing({ ...editing, address: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select value={editing.serviceType || "HVAC"} onChange={(e) => setEditing({ ...editing, serviceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
                  {SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How did they find us?</label>
                <select value={editing.leadSource || "direct"} onChange={(e) => setEditing({ ...editing, leadSource: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
                  {LEAD_SOURCES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem Description</label>
                <textarea value={editing.problemDescription || editing.notes || ""}
                  onChange={(e) => setEditing({ ...editing, problemDescription: e.target.value, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editing.status || "Lead"} onChange={(e) => setEditing({ ...editing, status: e.target.value as Job["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
                    {JOB_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <Field label="Scheduled (optional)" type="datetime-local" value={editing.scheduledAt ? editing.scheduledAt.slice(0, 16) : ""}
                  onChange={(v) => setEditing({ ...editing, scheduledAt: v ? new Date(v).toISOString() : undefined })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" rows={2} />
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

function Field({ label, type = "text", value, onChange, required }: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
    </div>
  );
}
