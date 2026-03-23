"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Job, Invoice } from "@/lib/types";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch("/api/admin/invoices").then((r) => r.json()),
    ]).then(([j, i]) => {
      setJobs(j);
      setInvoices(i);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const openJobs = jobs.filter((j) => !["Completed", "Invoiced", "Paid"].includes(j.status));
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const unpaidInvoices = invoices.filter((i) => i.status !== "Paid");
  const recentJobs = [...jobs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const cards = [
    { label: "Total Jobs", value: jobs.length, href: "/admin/jobs" },
    { label: "Open Jobs", value: openJobs.length, href: "/admin/jobs" },
    { label: "Total Invoiced", value: `$${totalInvoiced.toLocaleString()}`, href: "/admin/invoices" },
    { label: "Unpaid Invoices", value: unpaidInvoices.length, href: "/admin/invoices" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-navy mt-1">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-navy mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/admin/jobs", label: "Jobs" },
              { href: "/admin/service-log", label: "Service Log" },
              { href: "/admin/invoices", label: "Invoices" },
              { href: "/admin/inventory", label: "Inventory" },
              { href: "/admin/items", label: "Price List" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-navy hover:bg-amber hover:text-white transition-colors text-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-navy mb-4">Recent Jobs</h2>
          {recentJobs.length === 0 ? (
            <p className="text-gray-400 text-sm">No jobs yet</p>
          ) : (
            <ul className="space-y-2">
              {recentJobs.map((job) => (
                <li key={job.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 truncate mr-2">{job.customerName} — {job.serviceType}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColor(job.status)}`}>
                    {job.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
