"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/types";

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

const AUTH_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  reassigned: "bg-orange-100 text-orange-700",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  not_submitted: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-teal-100 text-teal-700",
  disputed: "bg-red-100 text-red-700",
};

function formatInvoiceStatus(s?: string): string {
  if (!s) return "Not Submitted";
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatAuthStatus(s?: string): string {
  if (!s) return "—";
  if (s === "reassigned") return "Re-assigned";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function WarrantyPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/jobs?warranty=true")
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then(data => {
        setJobs(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center"><div className="text-4xl mb-2">🛡️</div><p className="text-gray-500">Loading warranty jobs...</p></div>
      </div>
    );
  }

  const totalReimbursement = jobs.reduce((sum, j) => sum + (j.warrantyReimbursement || 0), 0);
  const pendingAuth = jobs.filter(j => !j.warrantyAuthStatus || j.warrantyAuthStatus === "pending").length;
  const paidCount = jobs.filter(j => j.warrantyInvoiceStatus === "paid").length;
  const submittedCount = jobs.filter(j => j.warrantyInvoiceStatus === "submitted").length;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h1 className="text-2xl font-black text-navy mb-1 flex items-center gap-2">
        <span>🛡️</span> Warranty Jobs
      </h1>
      <p className="text-sm text-gray-400 mb-4">Rely Home Warranty tracking</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-purple-700">{jobs.length}</p>
          <p className="text-xs text-purple-500">Total</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-yellow-700">{pendingAuth}</p>
          <p className="text-xs text-yellow-500">Auth Pending</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-blue-700">{submittedCount}</p>
          <p className="text-xs text-blue-500">Invoice Submitted</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-green-700">${totalReimbursement.toFixed(0)}</p>
          <p className="text-xs text-green-500">{paidCount} Paid</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-3">🛡️</div>
          <p className="text-gray-500 font-medium">No warranty jobs</p>
          <p className="text-sm text-gray-400 mt-1">Flag a job as &quot;Rely Home Warranty&quot; to see it here</p>
        </div>
      ) : (
        <>
          {/* Table header (desktop) */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 text-xs text-gray-400 uppercase tracking-wide px-4 pb-2">
            <span>Customer / Job</span>
            <span>WO#</span>
            <span>Auth Status</span>
            <span>Invoice Status</span>
            <span className="text-right">Reimb.</span>
          </div>

          <div className="space-y-2">
            {jobs.map(job => (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform">
                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy truncate">{job.customerName}</p>
                      <p className="text-xs text-gray-400">#{job.jobNumber} · {job.serviceType}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700"}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {job.warrantyWorkOrderNumber && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">WO: {job.warrantyWorkOrderNumber}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded font-medium ${AUTH_STATUS_COLORS[job.warrantyAuthStatus || ""] || "bg-gray-100 text-gray-500"}`}>
                      Auth: {formatAuthStatus(job.warrantyAuthStatus)}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-medium ${INVOICE_STATUS_COLORS[job.warrantyInvoiceStatus || "not_submitted"] || "bg-gray-100 text-gray-500"}`}>
                      {formatInvoiceStatus(job.warrantyInvoiceStatus)}
                    </span>
                    {job.warrantyReimbursement ? (
                      <span className="text-green-600 font-medium">${job.warrantyReimbursement.toFixed(2)}</span>
                    ) : null}
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-navy truncate">{job.customerName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700"}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">#{job.jobNumber} · {job.serviceType}</p>
                  </div>
                  <span className="text-sm text-gray-700 font-mono whitespace-nowrap">
                    {job.warrantyWorkOrderNumber || "—"}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${AUTH_STATUS_COLORS[job.warrantyAuthStatus || ""] || "bg-gray-100 text-gray-500"}`}>
                    {formatAuthStatus(job.warrantyAuthStatus)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${INVOICE_STATUS_COLORS[job.warrantyInvoiceStatus || "not_submitted"] || "bg-gray-100 text-gray-500"}`}>
                    {formatInvoiceStatus(job.warrantyInvoiceStatus)}
                  </span>
                  <span className="text-sm text-right font-semibold text-navy whitespace-nowrap">
                    {job.warrantyReimbursement ? `$${job.warrantyReimbursement.toFixed(2)}` : "—"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
