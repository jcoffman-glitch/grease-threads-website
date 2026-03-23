"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";

const statuses: Job["status"][] = ["Called", "Scheduled", "In Progress", "Completed", "Invoiced", "Paid"];

const emptyJob: Omit<Job, "id"> = {
  date: new Date().toISOString().split("T")[0],
  customerName: "",
  phone: "",
  serviceType: "",
  status: "Called",
  amount: 0,
  notes: "",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [editing, setEditing] = useState<Partial<Job> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/jobs").then((r) => r.json()).then(setJobs).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? jobs : jobs.filter((j) => j.status === filter);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/jobs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const updated = await res.json();
    if (editing.id) {
      setJobs(jobs.map((j) => (j.id === updated.id ? updated : j)));
    } else {
      setJobs([...jobs, updated]);
    }
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this job?")) return;
    await fetch("/api/admin/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setJobs(jobs.filter((j) => j.id !== id));
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-navy">Jobs</h1>
        <button
          onClick={() => setEditing({ ...emptyJob })}
          className="px-4 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark transition-colors text-sm font-medium"
        >
          + New Job
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {["All", ...statuses].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === s ? "bg-navy text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 hidden sm:table-cell">Phone</th>
              <th className="px-4 py-3 hidden md:table-cell">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden sm:table-cell">Amount</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No jobs found</td></tr>
            ) : (
              filtered.map((job) => (
                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">{job.date}</td>
                  <td className="px-4 py-3 font-medium text-navy">{job.customerName}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{job.phone}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{job.serviceType}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">${job.amount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing({ ...job })} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                      <button onClick={() => remove(job.id)} className="text-red-600 hover:text-red-800 text-xs">Del</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-navy mb-4">{editing.id ? "Edit Job" : "New Job"}</h2>
            <div className="space-y-3">
              <Field label="Date" type="date" value={editing.date || ""} onChange={(v) => setEditing({ ...editing, date: v })} />
              <Field label="Customer Name" value={editing.customerName || ""} onChange={(v) => setEditing({ ...editing, customerName: v })} />
              <Field label="Phone" value={editing.phone || ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
              <Field label="Service Type" value={editing.serviceType || ""} onChange={(v) => setEditing({ ...editing, serviceType: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editing.status || "Called"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as Job["status"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Field label="Amount" type="number" value={String(editing.amount || 0)} onChange={(v) => setEditing({ ...editing, amount: parseFloat(v) || 0 })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editing.notes || ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  rows={3}
                />
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

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
    </div>
  );
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    Called: "bg-blue-100 text-blue-700",
    Scheduled: "bg-purple-100 text-purple-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Completed: "bg-green-100 text-green-700",
    Invoiced: "bg-orange-100 text-orange-700",
    Paid: "bg-emerald-100 text-emerald-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
