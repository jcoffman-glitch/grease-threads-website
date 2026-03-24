"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/types";

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

function CoverageBadge({ coverage }: { coverage?: string }) {
  if (!coverage) return <span className="text-xs text-gray-400">Pending</span>;
  if (coverage === "covered") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Covered</span>;
  return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Not Covered</span>;
}

export default function WarrantyPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/jobs")
      .then(r => r.json())
      .then(data => {
        const warrantyJobs = (Array.isArray(data) ? data : []).filter((j: Job) => j.warrantyFlag);
        setJobs(warrantyJobs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center"><div className="text-4xl mb-2">🛡️</div><p className="text-gray-500">Loading warranty jobs...</p></div>
      </div>
    );
  }

  const totalReimbursement = jobs.reduce((sum, j) => sum + (j.warrantyReimbursement || 0), 0);
  const pendingCount = jobs.filter(j => !j.warrantyCovered).length;
  const coveredCount = jobs.filter(j => j.warrantyCovered === "covered").length;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h1 className="text-2xl font-black text-navy mb-1">Warranty Jobs</h1>
      <p className="text-sm text-gray-400 mb-4">Rely Home Warranty</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-purple-700">{jobs.length}</p>
          <p className="text-xs text-purple-500">Total</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-yellow-700">{pendingCount}</p>
          <p className="text-xs text-yellow-500">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-green-700">${totalReimbursement.toFixed(0)}</p>
          <p className="text-xs text-green-500">{coveredCount} Covered</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-3">🛡️</div>
          <p className="text-gray-500 font-medium">No warranty jobs</p>
          <p className="text-sm text-gray-400 mt-1">Flag a job as &quot;Rely Home Warranty&quot; to see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <Link key={job.id} href={`/admin/jobs/${job.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy truncate">{job.customerName}</p>
                  <p className="text-sm text-gray-500 truncate">{job.address || "No address"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{job.serviceType}</span>
                    {job.warrantyAuthNumber && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Auth: {job.warrantyAuthNumber}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={job.status} />
                  <CoverageBadge coverage={job.warrantyCovered} />
                </div>
              </div>
              {job.scheduledAt && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(job.scheduledAt).toLocaleDateString()} at {new Date(job.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {job.warrantyReimbursement ? (
                <p className="text-xs text-green-600 font-medium mt-1">Reimbursement: ${job.warrantyReimbursement.toFixed(2)}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
