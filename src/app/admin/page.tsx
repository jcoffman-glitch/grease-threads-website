"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { Job, Invoice, InventoryItem } from "@/lib/types";

function NewJobModal({ onClose, onSaved }: { onClose: () => void; onSaved: (j: Job) => void }) {
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "",
    serviceType: "HVAC", problemDescription: "", address: "",
    scheduledAt: "", status: "New", notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const saved = await res.json();
    onSaved(saved);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-navy">New Job</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={save} className="p-5 space-y-4">
          <input required placeholder="Customer Name" value={form.customerName}
            onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
            className="w-full border rounded-lg px-3 py-3 text-base" />
          <input required placeholder="Phone" value={form.customerPhone}
            onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
            className="w-full border rounded-lg px-3 py-3 text-base" />
          <input placeholder="Email" value={form.customerEmail}
            onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
            className="w-full border rounded-lg px-3 py-3 text-base" />
          <input placeholder="Address" value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            className="w-full border rounded-lg px-3 py-3 text-base" />
          <select value={form.serviceType}
            onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
            className="w-full border rounded-lg px-3 py-3 text-base">
            {["HVAC", "Appliance Repair", "Commercial Kitchen", "Handyman", "Other"].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <textarea required placeholder="Problem Description" value={form.problemDescription}
            onChange={e => setForm(f => ({ ...f, problemDescription: e.target.value }))}
            rows={3} className="w-full border rounded-lg px-3 py-3 text-base" />
          <input type="datetime-local" placeholder="Scheduled" value={form.scheduledAt}
            onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
            className="w-full border rounded-lg px-3 py-3 text-base" />
          <button type="submit" disabled={saving}
            className="w-full bg-amber text-white font-bold py-3 rounded-xl text-base disabled:opacity-50">
            {saving ? "Saving..." : "Create Job"}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    New: "bg-gray-200 text-gray-800",
    Lead: "bg-gray-100 text-gray-700",
    Called: "bg-blue-100 text-blue-700",
    Scheduled: "bg-blue-200 text-blue-800",
    "En Route": "bg-yellow-200 text-yellow-800",
    "On Scene": "bg-orange-200 text-orange-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    Complete: "bg-green-200 text-green-800",
    Completed: "bg-green-100 text-green-700",
    Invoiced: "bg-purple-200 text-purple-800",
    Paid: "bg-teal-200 text-teal-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

// ── Anthoney's Dashboard ──────────────────────────────────────────────────────

function TechDashboard({ jobs }: { jobs: Job[] }) {
  const today = new Date().toDateString();
  const todaysJobs = jobs
    .filter(j => {
      if (!j.scheduledAt) return false;
      return new Date(j.scheduledAt).toDateString() === today;
    })
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h1 className="text-2xl font-black text-navy mb-1">Today&apos;s Jobs</h1>
      <p className="text-sm text-gray-400 mb-5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>

      {todaysJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-gray-500 font-medium">No jobs scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todaysJobs.map(job => (
            <Link key={job.id} href={`/admin/jobs/${job.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-navy text-lg">{job.customerName}</p>
                  <p className="text-sm text-gray-500">{job.address || "No address"}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{job.serviceType}</span>
                <span>·</span>
                <span className="font-semibold text-navy">
                  {new Date(job.scheduledAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Joe's Dashboard ──────────────────────────────────────────────────────────

function AdminDashboardView({ jobs, invoices, inventory, showNewJob, setShowNewJob }: {
  jobs: Job[];
  invoices: Invoice[];
  inventory: InventoryItem[];
  showNewJob: boolean;
  setShowNewJob: (v: boolean) => void;
}) {
  const today = new Date().toDateString();
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const newRequests = jobs.filter(j => j.status === "New" || j.status === "Lead");
  const todaysJobs = jobs.filter(j => j.scheduledAt && new Date(j.scheduledAt).toDateString() === today);
  const unpaidInvoices = invoices.filter(i => i.status !== "Paid");
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
  const jobsThisWeek = jobs.filter(j => {
    const d = j.scheduledAt || j.createdAt;
    return d && new Date(d) >= thisWeekStart;
  });
  const revenueThisMonth = invoices
    .filter(i => i.status === "Paid" && i.paidAt && new Date(i.paidAt) >= thisMonthStart)
    .reduce((sum, i) => sum + (i.total ?? 0), 0);
  const pendingReviews = jobs.filter(j =>
    (j.status === "Complete" || j.status === "Completed" || j.status === "Paid") && !j.googleReviewSent
  );
  const lowStock = inventory.filter(i => i.qtyOnHand <= i.reorderPoint);

  // Upcoming subscription reminders (jobs with subscription_flag due in next 3 days)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const subReminders = jobs.filter(j =>
    j.subscriptionFlag && j.scheduledAt && new Date(j.scheduledAt) <= threeDaysFromNow && new Date(j.scheduledAt) >= new Date()
  );

  // Suggested action
  let suggestedAction = "";
  if (unpaidInvoices.length > 0) suggestedAction = `${unpaidInvoices.length} invoice${unpaidInvoices.length > 1 ? "s" : ""} unpaid — send reminder?`;
  else if (newRequests.length > 0) suggestedAction = `${newRequests.length} new request${newRequests.length > 1 ? "s" : ""} — review and schedule`;
  else if (pendingReviews.length > 0) suggestedAction = `${pendingReviews.length} review${pendingReviews.length > 1 ? "s" : ""} to send`;

  const todaySchedule = todaysJobs.sort((a, b) =>
    new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()
  );

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {showNewJob && (
        <NewJobModal
          onClose={() => setShowNewJob(false)}
          onSaved={() => window.location.reload()}
        />
      )}

      {/* Action Queue */}
      <h1 className="text-2xl font-black text-navy mb-4">Command Center</h1>

      {newRequests.length > 0 && (
        <Link href="/admin/jobs?filter=Lead"
          className="flex items-center gap-3 bg-amber text-white px-5 py-4 rounded-xl mb-4 animate-pulse shadow-lg">
          <span className="text-2xl">🔔</span>
          <span className="font-bold text-lg">{newRequests.length} New Request{newRequests.length > 1 ? "s" : ""} — Tap to review</span>
          <span className="ml-auto text-white/80">→</span>
        </Link>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Link href="/admin/jobs?filter=Lead"
          className="bg-amber/10 border-2 border-amber rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">🔔</span>
          <span className="text-3xl font-black text-amber">{newRequests.length}</span>
          <span className="text-xs font-semibold text-amber/80 mt-1">New Requests</span>
        </Link>
        <Link href="/admin/invoices?filter=unpaid"
          className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">🧾</span>
          <span className="text-2xl font-black text-red-600">{unpaidInvoices.length}</span>
          <span className="text-xs font-semibold text-red-500 mt-0.5">${unpaidTotal.toFixed(0)} owed</span>
        </Link>
        <Link href="/admin/schedule"
          className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">📅</span>
          <span className="text-3xl font-black text-blue-600">{subReminders.length}</span>
          <span className="text-xs font-semibold text-blue-500 mt-1">Sub Due Soon</span>
        </Link>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-navy text-lg">Today&apos;s Schedule</h2>
        </div>
        {todaySchedule.length === 0 ? (
          <div className="px-5 py-6 text-gray-400 text-sm text-center">No jobs scheduled for today</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todaySchedule.map(job => (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}
                className="flex items-start gap-3 px-5 py-4 active:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy truncate">{job.customerName}</p>
                  <p className="text-sm text-gray-500 truncate">{job.address || "No address"}</p>
                  <p className="text-xs text-gray-400">{job.serviceType} · {new Date(job.scheduledAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <StatusBadge status={job.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Business Pulse */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 p-5">
        <h2 className="font-bold text-navy text-lg mb-3">Business Pulse</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-navy">{jobsThisWeek.length}</p>
            <p className="text-xs text-gray-500">Jobs This Week</p>
          </div>
          <div>
            <p className="text-2xl font-black text-green-600">${revenueThisMonth.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Revenue This Mo.</p>
          </div>
          <div>
            <p className="text-2xl font-black text-yellow-600">{pendingReviews.length}</p>
            <p className="text-xs text-gray-500">Reviews Pending</p>
          </div>
        </div>
        {suggestedAction && (
          <div className="mt-4 bg-amber/10 rounded-lg p-3 text-sm text-amber-800 font-medium">
            💡 {suggestedAction}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button onClick={() => setShowNewJob(true)}
          className="w-full bg-amber text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-transform shadow-md">
          + New Job
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/jobs"
            className="bg-navy text-white font-semibold py-4 rounded-xl text-center active:scale-95 transition-transform">
            All Jobs
          </Link>
          <Link href="/admin/invoices"
            className="bg-navy text-white font-semibold py-4 rounded-xl text-center active:scale-95 transition-transform">
            Invoices
          </Link>
        </div>
        {lowStock.length > 0 && (
          <Link href="/admin/inventory?filter=low"
            className="block bg-orange-50 border border-orange-200 text-orange-700 font-semibold py-3 rounded-xl text-center text-sm">
            📦 {lowStock.length} item{lowStock.length > 1 ? "s" : ""} low in stock
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard Component ────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewJob, setShowNewJob] = useState(false);

  // Role switcher state (Ryan only)
  const realRole = session?.user?.role || "admin";
  const [viewAs, setViewAs] = useState<string>(realRole);

  useEffect(() => {
    setViewAs(realRole);
  }, [realRole]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/jobs").then(r => r.json()).catch(() => []),
      fetch("/api/admin/invoices").then(r => r.json()).catch(() => []),
      fetch("/api/admin/inventory").then(r => r.json()).catch(() => []),
    ]).then(([j, i, inv]) => {
      setJobs(Array.isArray(j) ? j : []);
      setInvoices(Array.isArray(i) ? i : []);
      setInventory(Array.isArray(inv) ? inv : []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-3">🔧</div>
          <p className="text-gray-500">Loading command center...</p>
        </div>
      </div>
    );
  }

  const effectiveRole = viewAs === "technician" ? "technician" : (viewAs === "admin" ? "admin" : realRole);

  return (
    <>
      {/* Role Switcher (Ryan / IT only) */}
      {realRole === "it" && (
        <div className="max-w-2xl mx-auto mb-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-sm font-semibold text-indigo-700">Viewing as:</span>
            <select
              value={viewAs}
              onChange={e => setViewAs(e.target.value)}
              className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm font-medium bg-white text-indigo-800"
            >
              <option value="it">Ryan (IT/Admin)</option>
              <option value="admin">Joe (Admin)</option>
              <option value="technician">Anthoney (Tech)</option>
            </select>
          </div>
        </div>
      )}

      {effectiveRole === "technician" ? (
        <TechDashboard jobs={jobs} />
      ) : (
        <AdminDashboardView
          jobs={jobs}
          invoices={invoices}
          inventory={inventory}
          showNewJob={showNewJob}
          setShowNewJob={setShowNewJob}
        />
      )}
    </>
  );
}
