"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Job, Invoice, InventoryItem } from "@/lib/types";

function NewJobModal({ onClose, onSaved }: { onClose: () => void; onSaved: (j: Job) => void }) {
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "",
    serviceType: "HVAC", problemDescription: "", address: "",
    scheduledAt: "", status: "Lead", notes: "",
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
          <select value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full border rounded-lg px-3 py-3 text-base">
            {["Lead", "Called", "Scheduled", "In Progress", "Completed", "Invoiced", "Paid"].map(s => (
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

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewJob, setShowNewJob] = useState(false);

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

  const today = new Date().toDateString();
  const newLeads = jobs.filter(j => j.status === "Lead");
  const todaysJobs = jobs.filter(j => {
    if (!j.scheduledAt) return false;
    return new Date(j.scheduledAt).toDateString() === today;
  });
  const inProgress = jobs.filter(j => j.status === "In Progress");
  const unpaidInvoices = invoices.filter(i => i.status !== "Paid");
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
  const completedToday = jobs.filter(j => {
    if (j.status !== "Completed") return false;
    const d = j.scheduledAt || j.createdAt || j.date;
    return d ? new Date(d).toDateString() === today : false;
  });
  const lowStock = inventory.filter(i => i.qtyOnHand <= i.reorderPoint);

  const todaySchedule = todaysJobs.sort((a, b) =>
    new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()
  );

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {showNewJob && (
        <NewJobModal
          onClose={() => setShowNewJob(false)}
          onSaved={j => setJobs(prev => [j, ...prev])}
        />
      )}

      {/* Alert Banner */}
      {newLeads.length > 0 && (
        <Link href="/admin/jobs?filter=Lead"
          className="flex items-center gap-3 bg-amber text-white px-5 py-4 rounded-xl mb-5 animate-pulse shadow-lg">
          <span className="text-2xl">🔔</span>
          <span className="font-bold text-lg">{newLeads.length} New Lead{newLeads.length > 1 ? "s" : ""} — Tap to review</span>
          <span className="ml-auto text-white/80">→</span>
        </Link>
      )}

      {/* Summary Cards Row 1 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Link href="/admin/jobs?filter=Lead"
          className="bg-amber/10 border-2 border-amber rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">🔔</span>
          <span className="text-3xl font-black text-amber">{newLeads.length}</span>
          <span className="text-xs font-semibold text-amber/80 mt-1">New Leads</span>
        </Link>
        <Link href="/admin/jobs?filter=today"
          className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">📅</span>
          <span className="text-3xl font-black text-blue-600">{todaysJobs.length}</span>
          <span className="text-xs font-semibold text-blue-500 mt-1">Today&apos;s Jobs</span>
        </Link>
        <Link href="/admin/jobs?filter=In+Progress"
          className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">⚠️</span>
          <span className="text-3xl font-black text-yellow-600">{inProgress.length}</span>
          <span className="text-xs font-semibold text-yellow-600 mt-1">In Progress</span>
        </Link>
      </div>

      {/* Summary Cards Row 2 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/admin/invoices?filter=unpaid"
          className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">🧾</span>
          <span className="text-2xl font-black text-red-600">{unpaidInvoices.length}</span>
          <span className="text-xs font-semibold text-red-500 mt-0.5">${unpaidTotal.toFixed(0)} unpaid</span>
        </Link>
        <Link href="/admin/jobs?filter=completed-today"
          className="bg-green-50 border-2 border-green-400 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">✅</span>
          <span className="text-3xl font-black text-green-600">{completedToday.length}</span>
          <span className="text-xs font-semibold text-green-600 mt-1">Done Today</span>
        </Link>
        <Link href="/admin/inventory?filter=low"
          className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
          <span className="text-2xl mb-1">📦</span>
          <span className="text-3xl font-black text-orange-600">{lowStock.length}</span>
          <span className="text-xs font-semibold text-orange-500 mt-1">Low Stock</span>
        </Link>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-navy text-lg">📅 Today&apos;s Schedule</h2>
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

      {/* Quick Actions */}
      <div className="space-y-3">
        <button onClick={() => setShowNewJob(true)}
          className="w-full bg-amber text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-transform shadow-md">
          ➕ New Job
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/jobs"
            className="bg-navy text-white font-semibold py-4 rounded-xl text-center active:scale-95 transition-transform">
            📋 All Jobs
          </Link>
          <Link href="/admin/invoices"
            className="bg-navy text-white font-semibold py-4 rounded-xl text-center active:scale-95 transition-transform">
            🧾 Invoices
          </Link>
        </div>
      </div>
    </div>
  );
}

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
    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
