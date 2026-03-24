"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Job, Subscription } from "@/lib/types";

interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  preferred_contact: string | null;
  notes: string | null;
  created_at: number | null;
}

const RECURRENCE_TYPES = [
  { value: "weekly", label: "Every N weeks" },
  { value: "monthly", label: "Every N months" },
  { value: "day_of_week", label: "Specific day of week" },
  { value: "nth_weekday", label: "Nth weekday of month" },
  { value: "quarterly", label: "Quarterly" },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    New: "bg-gray-200 text-gray-800",
    Lead: "bg-gray-100 text-gray-700",
    Scheduled: "bg-blue-200 text-blue-800",
    "Work Order": "bg-blue-200 text-blue-800",
    "En Route": "bg-yellow-200 text-yellow-800",
    Working: "bg-orange-200 text-orange-800",
    "On Scene": "bg-orange-200 text-orange-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    "Job Done": "bg-green-200 text-green-800",
    Complete: "bg-green-200 text-green-800",
    Completed: "bg-green-100 text-green-700",
    "Final Invoice": "bg-purple-100 text-purple-700",
    Invoiced: "bg-purple-200 text-purple-800",
    Payment: "bg-teal-100 text-teal-700",
    Paid: "bg-teal-200 text-teal-800",
    Review: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

// ── Inline Editable Field ─────────────────────────────────────────────────

function EditableField({ label, value, field, onSave, type = "text" }: {
  label: string;
  value: string;
  field: string;
  onSave: (field: string, value: string) => Promise<void>;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function commit() {
    setEditing(false);
    if (draft !== value) {
      await onSave(field, draft);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-20 shrink-0">{label}</span>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === "Enter" && commit()}
          className="flex-1 border border-amber rounded-lg px-2 py-1.5 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-gray-400 w-20 shrink-0">{label}</span>
      {type === "tel" && value ? (
        <a href={`tel:${value}`} className="flex-1 text-sm text-blue-600 font-semibold">{value}</a>
      ) : (
        <span className="flex-1 text-sm text-gray-700">{value || "—"}</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber transition-opacity p-1"
        title={`Edit ${label.toLowerCase()}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({
    planType: "residential" as "residential" | "commercial",
    recurrenceType: "monthly",
    recurrenceValue: 1,
    recurrenceDay: "Monday",
    recurrenceNth: 1,
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [reviewCopied, setReviewCopied] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [custRes, jobsRes, subsRes] = await Promise.all([
        fetch(`/api/admin/customers/${id}`).then(r => r.json()),
        fetch("/api/admin/jobs").then(r => r.json()).catch(() => []),
        fetch("/api/admin/subscriptions").then(r => r.json()).catch(() => []),
      ]);
      setCustomer(custRes);
      setNotes(custRes.notes || "");
      const customerJobs = (Array.isArray(jobsRes) ? jobsRes : []).filter((j: Job) =>
        j.customerEmail === custRes.email || j.customerName === custRes.name || j.customerPhone === custRes.phone
      );
      setJobs(customerJobs);
      const customerSubs = (Array.isArray(subsRes) ? subsRes : []).filter((s: Subscription) =>
        s.customerId === id
      );
      setSubscriptions(customerSubs);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Inline field save ──────────────────────────────────────────────

  async function saveField(field: string, value: string) {
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomer(updated);
    }
  }

  // ── Notes auto-save on blur ────────────────────────────────────────

  async function saveNotes() {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    setNotesSaving(true);
    await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setNotesSaving(false);
  }

  // ── Mark Review Sent ───────────────────────────────────────────────

  async function markReviewSent() {
    const paidJobs = jobs
      .filter(j => j.status === "Paid" || j.status === "Payment" || j.status === "Review" || j.status === "Job Done" || j.status === "Complete" || j.status === "Completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!paidJobs.length) return;
    const recentJob = paidJobs[0];
    await fetch(`/api/admin/jobs/${recentJob.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleReviewSent: true }),
    });
    setJobs(prev => prev.map(j => j.id === recentJob.id ? { ...j, googleReviewSent: true } : j));
  }

  // ── Copy Google Review Link ────────────────────────────────────────

  function copyReviewLink() {
    const url = "https://g.page/r/CQfLzAeaO1QDEBI/review";
    navigator.clipboard.writeText(url);
    setReviewCopied(true);
    setTimeout(() => setReviewCopied(false), 2000);
  }

  // ── Subscriptions ──────────────────────────────────────────────────

  async function createSubscription(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let recurrence: Record<string, unknown> = {};
    switch (subForm.recurrenceType) {
      case "weekly":
        recurrence = { type: "weekly", every: subForm.recurrenceValue };
        break;
      case "monthly":
        recurrence = { type: "monthly", every: subForm.recurrenceValue };
        break;
      case "day_of_week":
        recurrence = { type: "day_of_week", day: subForm.recurrenceDay };
        break;
      case "nth_weekday":
        recurrence = { type: "nth_weekday", nth: subForm.recurrenceNth, day: subForm.recurrenceDay };
        break;
      case "quarterly":
        recurrence = { type: "quarterly" };
        break;
    }

    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: id,
        planType: subForm.planType,
        recurrence: JSON.stringify(recurrence),
        startDate: subForm.startDate,
        nextDue: subForm.startDate,
        notes: subForm.notes,
      }),
    });
    const sub = await res.json();
    setSubscriptions(prev => [...prev, sub]);
    setShowSubForm(false);
    setSaving(false);
  }

  async function updateSubStatus(subId: string, status: string) {
    const res = await fetch("/api/admin/subscriptions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: subId, status }),
    });
    const updated = await res.json();
    setSubscriptions(prev => prev.map(s => s.id === subId ? updated : s));
  }

  // ── Loading / Not Found ────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center"><div className="text-4xl mb-2">👤</div><p className="text-gray-500">Loading customer...</p></div>
    </div>
  );

  if (!customer) return <div className="text-center py-16 text-gray-500">Customer not found</div>;

  const totalSpent = jobs.reduce((sum, j) => sum + (j.amount || 0), 0);
  const anyReviewSent = jobs.some(j => j.googleReviewSent);
  const hasReviewableJob = jobs.some(j =>
    (j.status === "Paid" || j.status === "Payment" || j.status === "Review" || j.status === "Job Done" || j.status === "Complete" || j.status === "Completed")
  );

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/customers" className="text-gray-400 hover:text-navy transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-black text-navy flex-1">{customer.name || "Unknown"}</h1>
      </div>

      {/* Contact Info card — inline editable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 space-y-3">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-2">Contact Info</h2>
        <EditableField label="Phone" value={customer.phone || ""} field="phone" onSave={saveField} type="tel" />
        <EditableField label="Email" value={customer.email || ""} field="email" onSave={saveField} type="email" />
        <EditableField label="Address" value={customer.address || ""} field="address" onSave={saveField} />
        <EditableField label="City" value={customer.city || ""} field="city" onSave={saveField} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-20 shrink-0">Contact</span>
          <select
            value={customer.preferred_contact || "call"}
            onChange={e => saveField("preferred_contact", e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm text-gray-700"
          >
            <option value="call">Phone Call</option>
            <option value="text">Text</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div className="pt-2 border-t border-gray-50 flex gap-4 text-sm">
          <div>
            <span className="text-gray-400">Jobs:</span> <span className="font-bold text-navy">{jobs.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Total Spent:</span> <span className="font-bold text-green-600">${totalSpent.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Review Status card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Review Status</h2>
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Review Sent:</span>
            {anyReviewSent ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Yes</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">No</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyReviewLink}
            className="flex-1 text-sm font-semibold py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
          >
            {reviewCopied ? "Copied!" : "Copy Review Link"}
          </button>
          {hasReviewableJob && !anyReviewSent && (
            <button
              onClick={markReviewSent}
              className="flex-1 text-sm font-semibold py-2.5 rounded-lg bg-amber text-white active:scale-95 transition-transform"
            >
              Mark Review Sent
            </button>
          )}
        </div>
      </div>

      {/* Notes section — auto-save on blur */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide">Notes</h2>
          {notesSaving && <span className="text-xs text-gray-400">Saving...</span>}
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          placeholder="Add customer notes..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber/50 resize-none"
        />
      </div>

      {/* Subscriptions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wide">Subscriptions</h2>
          <button onClick={() => setShowSubForm(!showSubForm)}
            className="bg-amber text-white text-sm font-semibold px-3 py-2 rounded-lg active:scale-95">
            + New Plan
          </button>
        </div>

        {showSubForm && (
          <form onSubmit={createSubscription} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Plan Type</label>
              <select value={subForm.planType} onChange={e => setSubForm(f => ({ ...f, planType: e.target.value as "residential" | "commercial" }))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm">
                <option value="residential">Residential ($75/mo)</option>
                <option value="commercial">Commercial ($150/mo)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Recurrence</label>
              <select value={subForm.recurrenceType} onChange={e => setSubForm(f => ({ ...f, recurrenceType: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm">
                {RECURRENCE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {(subForm.recurrenceType === "weekly" || subForm.recurrenceType === "monthly") && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Every N {subForm.recurrenceType === "weekly" ? "weeks" : "months"}</label>
                <input type="number" min="1" max="52" value={subForm.recurrenceValue}
                  onChange={e => setSubForm(f => ({ ...f, recurrenceValue: parseInt(e.target.value) || 1 }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
            )}
            {(subForm.recurrenceType === "day_of_week" || subForm.recurrenceType === "nth_weekday") && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Day</label>
                <select value={subForm.recurrenceDay} onChange={e => setSubForm(f => ({ ...f, recurrenceDay: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            )}
            {subForm.recurrenceType === "nth_weekday" && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nth occurrence</label>
                <select value={subForm.recurrenceNth} onChange={e => setSubForm(f => ({ ...f, recurrenceNth: parseInt(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value={1}>First</option>
                  <option value={2}>Second</option>
                  <option value={3}>Third</option>
                  <option value={4}>Fourth</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start Date</label>
              <input type="date" value={subForm.startDate}
                onChange={e => setSubForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes</label>
              <textarea value={subForm.notes} onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. access code: 1234" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-amber text-white font-bold py-3 rounded-lg text-sm disabled:opacity-50">
                {saving ? "Creating..." : "Create Plan"}
              </button>
              <button type="button" onClick={() => setShowSubForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        )}

        {subscriptions.length === 0 && !showSubForm ? (
          <p className="text-gray-400 text-sm text-center py-4">No active subscriptions</p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map(sub => {
              let recInfo = "";
              try {
                const rec = JSON.parse(sub.recurrence);
                if (rec.type === "weekly") recInfo = `Every ${rec.every} week(s)`;
                else if (rec.type === "monthly") recInfo = `Every ${rec.every} month(s)`;
                else if (rec.type === "day_of_week") recInfo = `Every ${rec.day}`;
                else if (rec.type === "nth_weekday") recInfo = `${["", "1st", "2nd", "3rd", "4th"][rec.nth]} ${rec.day} of month`;
                else if (rec.type === "quarterly") recInfo = "Quarterly";
              } catch { recInfo = "Custom"; }

              return (
                <div key={sub.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-navy capitalize">{sub.planType} Plan</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-gray-500">{recInfo}</p>
                  <p className="text-xs text-gray-400">Next due: {sub.nextDue ? new Date(sub.nextDue).toLocaleDateString() : "N/A"}</p>
                  {sub.notes && <p className="text-xs text-gray-400 mt-1">Notes: {sub.notes}</p>}
                  <div className="flex gap-2 mt-2">
                    {sub.status === "active" && (
                      <button onClick={() => updateSubStatus(sub.id, "paused")}
                        className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">Pause</button>
                    )}
                    {sub.status === "paused" && (
                      <button onClick={() => updateSubStatus(sub.id, "active")}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Resume</button>
                    )}
                    {sub.status !== "cancelled" && (
                      <button onClick={() => updateSubStatus(sub.id, "cancelled")}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">Cancel</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Job History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-navy text-sm uppercase tracking-wide mb-3">Job History</h2>
        {jobs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No jobs yet.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-2 px-2 rounded">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">{job.jobNumber}</span>
                    <span className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-semibold text-navy">{job.serviceType}</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.amount ? (
                    <span className="text-xs font-semibold text-gray-500">${job.amount.toFixed(0)}</span>
                  ) : null}
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
            <div className="pt-2 text-right text-sm text-gray-400">
              Total spent: <span className="font-bold text-green-600">${totalSpent.toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
