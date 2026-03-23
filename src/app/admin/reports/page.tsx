"use client";

import { useEffect, useState } from "react";

interface ReportData {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    ytd: number;
    outstanding: number;
  };
  serviceTypeMonth: { serviceType: string; count: number }[];
  serviceTypeAll: { serviceType: string; count: number }[];
  jobStatus: { status: string; count: number }[];
  leadSourceMonth: { source: string; count: number }[];
  leadSourceAll: { source: string; count: number }[];
  topCustomers: { customerName: string; customerPhone: string; jobCount: number; totalSpent: number }[];
  recentActivity: { jobNumber: string; customerName: string; serviceType: string; status: string; createdAt: string }[];
  lowInventory: { description: string; partNumber: string; qtyOnHand: number; reorderPoint: number; supplier: string }[];
}

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  Lead: "bg-gray-400",
  Scheduled: "bg-blue-400",
  "In Progress": "bg-yellow-400",
  Completed: "bg-green-400",
  Invoiced: "bg-purple-400",
  Paid: "bg-emerald-500",
};

function BarChart({ data, label }: { data: { serviceType: string; count: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 mb-2">{label}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No data</p>
      ) : (
        <div className="space-y-2">
          {data.map(d => (
            <div key={d.serviceType} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-36 truncate">{d.serviceType || "Unknown"}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 w-6 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load report data"); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading reports…</div>;
  if (error || !data) return <div className="text-red-500 p-4">{error || "No data"}</div>;

  const totalJobs = data.jobStatus.reduce((s, r) => s + r.count, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">📊 Business Reports</h1>

      {/* Revenue Cards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Revenue</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "This Month", value: data.revenue.thisMonth, color: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
            { label: "Last Month", value: data.revenue.lastMonth, color: "bg-blue-50 border-blue-200", text: "text-blue-700" },
            { label: "Year to Date", value: data.revenue.ytd, color: "bg-purple-50 border-purple-200", text: "text-purple-700" },
            { label: "Outstanding", value: data.revenue.outstanding, color: "bg-amber-50 border-amber-200", text: "text-amber-700" },
          ].map(card => (
            <div key={card.label} className={`rounded-xl border-2 p-4 ${card.color}`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.text}`}>{fmt$(card.value)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Jobs by Service Type */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Jobs by Service Type</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5 grid md:grid-cols-2 gap-6">
          <BarChart data={data.serviceTypeMonth} label="This Month" />
          <BarChart data={data.serviceTypeAll} label="All Time" />
        </div>
      </section>

      {/* Jobs by Status */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Jobs by Status</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {data.jobStatus.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No jobs yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.jobStatus.map(s => (
                <div key={s.status} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[s.status] || "bg-gray-300"}`} />
                  <span className="text-sm font-medium text-gray-700">{s.status}</span>
                  <span className="ml-auto text-sm font-bold text-gray-500">{s.count}</span>
                  <span className="text-xs text-gray-400">({totalJobs > 0 ? Math.round((s.count / totalJobs) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lead Sources */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Lead Sources</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-gray-600">Source</th>
                <th className="text-right px-4 py-2 font-semibold text-gray-600">This Month</th>
                <th className="text-right px-4 py-2 font-semibold text-gray-600">All Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {["Direct Call", "Facebook", "Google Search", "Google Maps", "Referral", "Website", "Other", "direct", null].map(src => {
                const month = data.leadSourceMonth.find(r => r.source === src)?.count || 0;
                const all = data.leadSourceAll.find(r => r.source === src)?.count || 0;
                if (month === 0 && all === 0) return null;
                return (
                  <tr key={String(src)} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{src || "Unknown"}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{month || "—"}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-700">{all || "—"}</td>
                  </tr>
                );
              })}
              {data.leadSourceAll.filter(r => !["Direct Call","Facebook","Google Search","Google Maps","Referral","Website","Other","direct",null].includes(r.source as string)).map(r => (
                <tr key={r.source} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{r.source || "Unknown"}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{data.leadSourceMonth.find(m => m.source === r.source)?.count || "—"}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-700">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Customers */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Top Customers (All Time)</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {data.topCustomers.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 italic">No customer data yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Phone</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Jobs</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topCustomers.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{c.customerName || "Unknown"}</td>
                    <td className="px-4 py-2 text-gray-600">{c.customerPhone || "—"}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{c.jobCount}</td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-600">{fmt$(c.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {data.recentActivity.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 italic">No activity yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Job #</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Service</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentActivity.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{a.jobNumber || "—"}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{a.customerName}</td>
                    <td className="px-4 py-2 text-gray-600">{a.serviceType}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || "bg-gray-200"} bg-opacity-20`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[a.status] || "bg-gray-400"}`} />
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-500 text-xs">{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Low Inventory Alert */}
      {data.lowInventory.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-red-600 mb-3">⚠️ Low Inventory Alert</h2>
          <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-red-100 border-b border-red-200">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-red-700">Part Name</th>
                  <th className="text-left px-4 py-2 font-semibold text-red-700">Part #</th>
                  <th className="text-right px-4 py-2 font-semibold text-red-700">Qty On Hand</th>
                  <th className="text-right px-4 py-2 font-semibold text-red-700">Reorder Point</th>
                  <th className="text-left px-4 py-2 font-semibold text-red-700">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {data.lowInventory.map((item, i) => (
                  <tr key={i} className="hover:bg-red-100/50">
                    <td className="px-4 py-2 font-medium text-gray-800">{item.description}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.partNumber}</td>
                    <td className="px-4 py-2 text-right font-bold text-red-600">{item.qtyOnHand}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{item.reorderPoint}</td>
                    <td className="px-4 py-2 text-gray-600">{item.supplier || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data.lowInventory.length === 0 && (
        <section className="bg-green-50 rounded-xl border border-green-200 p-4 text-sm text-green-700">
          ✅ All inventory levels are above reorder points.
        </section>
      )}
    </div>
  );
}
