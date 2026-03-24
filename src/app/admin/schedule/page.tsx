"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/types";

const FILTERS = ["All", "Joe", "Anthoney", "Warranty", "Subscription"] as const;

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    New: "bg-gray-200 text-gray-800",
    Lead: "bg-gray-100 text-gray-700",
    Scheduled: "bg-blue-200 text-blue-800",
    "En Route": "bg-yellow-200 text-yellow-800",
    "On Scene": "bg-orange-200 text-orange-800",
    Complete: "bg-green-200 text-green-800",
    Completed: "bg-green-100 text-green-700",
    "In Progress": "bg-yellow-100 text-yellow-800",
    Invoiced: "bg-purple-200 text-purple-800",
    Paid: "bg-teal-200 text-teal-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function getDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (d <= endOfWeek) return "This Week";
  if (d <= endOfNextWeek) return "Next Week";
  return "Later";
}

export default function SchedulePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    fetch("/api/admin/jobs")
      .then(r => r.json())
      .then(data => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter to upcoming scheduled jobs
  const now = new Date();
  const upcoming = jobs
    .filter(j => {
      if (!j.scheduledAt) return false;
      // Include today and future
      const d = new Date(j.scheduledAt);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d >= today;
    })
    .filter(j => {
      if (filter === "All") return true;
      if (filter === "Joe") return j.assignedTo === "joe" || !j.assignedTo;
      if (filter === "Anthoney") return j.assignedTo === "anthoney";
      if (filter === "Warranty") return j.warrantyFlag;
      if (filter === "Subscription") return j.subscriptionFlag;
      return true;
    })
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  // Group by date
  const groups: Record<string, Job[]> = {};
  const groupOrder = ["Today", "Tomorrow", "This Week", "Next Week", "Later"];
  for (const job of upcoming) {
    const group = getDateGroup(new Date(job.scheduledAt!));
    if (!groups[group]) groups[group] = [];
    groups[group].push(job);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center"><div className="text-4xl mb-2">📅</div><p className="text-gray-500">Loading schedule...</p></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h1 className="text-2xl font-black text-navy mb-4">Schedule</h1>

      {/* Filter bar */}
      <div data-testid="schedule-filter-bar" className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
              filter === f
                ? "bg-amber text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {upcoming.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-gray-500 font-medium">No upcoming jobs{filter !== "All" ? ` for "${filter}"` : ""}</p>
        </div>
      ) : (
        <div data-testid="schedule-job-list" className="space-y-6">
          {groupOrder.map(group => {
            const groupJobs = groups[group];
            if (!groupJobs || groupJobs.length === 0) return null;
            return (
              <div key={group}>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">{group}</h2>
                <div className="space-y-2">
                  {groupJobs.map(job => (
                    <Link key={job.id} href={`/admin/jobs/${job.id}`}
                      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-navy">
                              {new Date(job.scheduledAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {job.warrantyFlag && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Warranty</span>}
                            {job.subscriptionFlag && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Sub</span>}
                          </div>
                          <p className="font-semibold text-navy truncate">{job.customerName}</p>
                          <p className="text-sm text-gray-500 truncate">{job.address || "No address"}</p>
                          <p className="text-xs text-gray-400">{job.serviceType}</p>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
