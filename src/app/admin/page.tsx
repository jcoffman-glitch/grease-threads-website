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
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

// ── Anthoney's Dashboard — "What's My Day" ──────────────────────────────────

function TechDashboard({ jobs }: { jobs: Job[] }) {
  const today = new Date().toDateString();
  const todaysJobs = jobs
    .filter(j => {
      if (!j.scheduledAt) return false;
      return new Date(j.scheduledAt).toDateString() === today;
    })
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  function mapsUrl(address: string) {
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h1 className="text-2xl font-black text-navy mb-1">Today&apos;s Jobs</h1>
      <p className="text-sm text-gray-400 mb-5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>

      {todaysJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-gray-500 font-medium">No jobs scheduled for today. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todaysJobs.map(job => (
            <Link key={job.id} href={`/admin/jobs/${job.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between mb-3">
                <p className="font-black text-navy text-xl leading-tight">{job.customerName}</p>
                <StatusBadge status={job.status} />
              </div>
              {job.address ? (
                <a
                  href={mapsUrl(job.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="block text-sm text-blue-600 font-medium mb-2 underline"
                >
                  {job.address}
                </a>
              ) : (
                <p className="text-sm text-gray-400 mb-2">No address</p>
              )}
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

// ── Joe's Dashboard — "Grow & Run" ──────────────────────────────────────────

function AdminDashboardView({ jobs, invoices, showNewJob, setShowNewJob }: {
  jobs: Job[];
  invoices: Invoice[];
  showNewJob: boolean;
  setShowNewJob: (v: boolean) => void;
}) {
  const today = new Date().toDateString();
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Action Queue counts
  const newRequests = jobs.filter(j => j.status === "Lead");
  const outstandingInvoices = invoices.filter(i => i.status === "Sent" || i.status === "Overdue" || i.status === "Draft");
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
  const followUps = jobs.filter(j => j.followUpRequired);

  // Today's schedule
  const todaySchedule = jobs
    .filter(j => j.scheduledAt && new Date(j.scheduledAt).toDateString() === today)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  // Business Pulse
  const jobsThisWeek = jobs.filter(j => {
    const d = j.scheduledAt || j.createdAt;
    return d && new Date(d) >= thisWeekStart;
  });
  const revenueThisMonth = invoices
    .filter(i => i.status === "Paid" && i.paidAt && new Date(i.paidAt) >= thisMonthStart)
    .reduce((sum, i) => sum + (i.total ?? 0), 0);
  const pendingReviews = jobs.filter(j =>
    (j.status === "Paid" || j.status === "Payment" || j.status === "Review" || j.status === "Complete" || j.status === "Completed" || j.status === "Job Done") && !j.googleReviewSent
  );

  // Suggested Next Action (spec priority)
  let suggestedAction = "";
  if (newRequests.length > 0) {
    suggestedAction = `Call back ${newRequests.length} new lead${newRequests.length > 1 ? "s" : ""}`;
  } else if (outstandingInvoices.length > 0) {
    suggestedAction = `Follow up on ${outstandingInvoices.length} unpaid invoice${outstandingInvoices.length > 1 ? "s" : ""}`;
  } else if (pendingReviews.length > 0) {
    suggestedAction = `Request Google reviews from ${pendingReviews.length} customer${pendingReviews.length > 1 ? "s" : ""}`;
  } else {
    suggestedAction = "All caught up! Great work.";
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {showNewJob && (
        <NewJobModal
          onClose={() => setShowNewJob(false)}
          onSaved={() => window.location.reload()}
        />
      )}

      <h1 className="text-2xl font-black text-navy mb-4">Command Center</h1>

      {/* Action Queue — 3 cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Link href="/admin/jobs?filter=Lead"
          className="bg-amber/10 border-2 border-amber rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-3xl font-black text-amber">{newRequests.length}</span>
          <span className="text-xs font-semibold text-amber/80 mt-1">New Requests</span>
        </Link>
        <Link href="/admin/invoices"
          className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl font-black text-red-600">{outstandingInvoices.length}</span>
          <span className="text-xs font-semibold text-red-500 mt-0.5">${outstandingTotal.toFixed(0)} owed</span>
          <span className="text-xs font-semibold text-red-400">Invoices</span>
        </Link>
        <Link href="/admin/jobs?filter=followup"
          className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-3xl font-black text-orange-600">{followUps.length}</span>
          <span className="text-xs font-semibold text-orange-500 mt-1">Follow-ups</span>
        </Link>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-navy text-lg">Today&apos;s Schedule</h2>
        </div>
        {todaySchedule.length === 0 ? (
          <div className="px-5 py-6 text-gray-400 text-sm text-center">Nothing scheduled today.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todaySchedule.map(job => (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}
                className="flex items-center gap-3 px-5 py-4 active:bg-gray-50">
                <span className="text-sm font-bold text-navy whitespace-nowrap">
                  {new Date(job.scheduledAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy truncate">{job.customerName}</p>
                  <p className="text-xs text-gray-400 truncate">{job.address || "No address"} · {job.serviceType}</p>
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
      </div>

      {/* Suggested Next Action */}
      <div className="bg-amber/10 rounded-xl p-4 mb-4 border border-amber/30">
        <p className="text-sm font-bold text-navy mb-1">Suggested Next Action</p>
        <p className="text-sm text-amber-800">{suggestedAction}</p>
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
      </div>
    </div>
  );
}

// ── Ryan's System Card ──────────────────────────────────────────────────────

function SystemCard() {
  const [info, setInfo] = useState<{
    testBypass: boolean;
    resendKey: boolean;
    anthropicKey: boolean;
    commitSha: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/system-info")
      .then(r => r.json())
      .then(setInfo)
      .catch(() => null);
  }, []);

  if (!info) return null;

  return (
    <div className="max-w-2xl mx-auto mt-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-navy text-lg mb-3">System</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">TEST_AUTH_BYPASS</span>
            {info.testBypass ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">ON</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">OFF</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">RESEND_API_KEY</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${info.resendKey ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {info.resendKey ? "Set" : "Not Set"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ANTHROPIC_API_KEY</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${info.anthropicKey ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {info.anthropicKey ? "Set" : "Not Set"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Build</span>
            <span className="text-xs font-mono text-gray-500">{info.commitSha}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link href="/admin/users" className="text-sm text-blue-600 font-medium">
            Manage Users →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
    ]).then(([j, i]) => {
      setJobs(Array.isArray(j) ? j : []);
      setInvoices(Array.isArray(i) ? i : []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-pulse space-y-3 max-w-md mx-auto">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-24 bg-gray-200 rounded-xl" />
              <div className="h-24 bg-gray-200 rounded-xl" />
              <div className="h-24 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-40 bg-gray-200 rounded-xl" />
          </div>
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
          showNewJob={showNewJob}
          setShowNewJob={setShowNewJob}
        />
      )}

      {/* System card — only for IT role viewing as IT */}
      {realRole === "it" && effectiveRole !== "technician" && viewAs === "it" && (
        <SystemCard />
      )}
    </>
  );
}
