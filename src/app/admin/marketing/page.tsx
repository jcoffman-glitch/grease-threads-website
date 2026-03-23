"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";

const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJaxfsFK2hhkYRlSUOXJr5gfk";
const CONTENT_CALENDAR_URL = "https://docs.google.com/spreadsheets/d/1SoiDk8Y6EJ4yckEH7if8GnaK3C1Cwmidj7ZKQpZNWR0";
const FACEBOOK_PAGE_URL = "https://www.facebook.com/profile.php?id=61574237036155";

const LEAD_SOURCE_LABELS: Record<string, string> = {
  direct: "Direct Call",
  facebook: "Facebook",
  google_search: "Google Search",
  google_maps: "Google Maps",
  referral: "Referral",
  website: "Website Contact Form",
  other: "Other",
};

export default function MarketingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthJobs = jobs.filter((j) => {
    const d = new Date(j.createdAt || "");
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  // Lead source counts
  const countBySource = (jobList: Job[]) => {
    const counts: Record<string, number> = {};
    for (const j of jobList) {
      const src = j.leadSource || "direct";
      counts[src] = (counts[src] || 0) + 1;
    }
    return counts;
  };

  const monthCounts = countBySource(monthJobs);
  const allTimeCounts = countBySource(jobs);

  const allSources = Array.from(
    new Set([...Object.keys(monthCounts), ...Object.keys(allTimeCounts)])
  ).sort();

  // Jobs needing reviews
  const needsReview = jobs.filter(
    (j) => (j.status === "Completed" || j.status === "Paid") && !j.googleReviewSent
  ).sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());

  function copyReviewRequest(job: Job) {
    const firstName = job.customerName.split(" ")[0];
    const msg = `Hi ${firstName}! Thanks for calling Grease & Threads. If you have a moment, a Google review really helps small businesses like mine: ${GOOGLE_REVIEW_URL} — Thanks! - Rick`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(job.id);
      setTimeout(() => setCopiedId(null), 3000);
    });
  }

  if (loading) return <div className="text-gray-500 p-4">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-navy mb-6">📣 Marketing</h1>

      {/* Content Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-navy text-lg">📅 Content Calendar</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your Facebook content schedule</p>
        </div>
        <div className="p-5 flex flex-col sm:flex-row gap-3">
          <a
            href={CONTENT_CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
          >
            📊 Open Content Calendar
          </a>
          <a
            href={FACEBOOK_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            📘 Open Facebook Page
          </a>
        </div>
      </div>

      {/* Lead Source Tracking */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-navy text-lg">📊 Lead Sources</h2>
          <p className="text-sm text-gray-500 mt-0.5">How are customers finding you?</p>
        </div>
        <div className="p-5">
          {allSources.length === 0 ? (
            <p className="text-gray-400 text-sm">No lead source data yet. Start tracking by setting lead source when creating jobs.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left text-xs uppercase">
                  <th className="pb-2">Source</th>
                  <th className="pb-2 text-right">This Month</th>
                  <th className="pb-2 text-right">All Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSources.map((src) => (
                  <tr key={src}>
                    <td className="py-2 font-medium text-gray-700">
                      {LEAD_SOURCE_LABELS[src] || src}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {monthCounts[src] || 0}
                    </td>
                    <td className="py-2 text-right font-bold text-navy">
                      {allTimeCounts[src] || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Jobs Needing Reviews */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-navy text-lg">⭐ Jobs Needing Reviews</h2>
            <p className="text-sm text-gray-500 mt-0.5">Completed/Paid jobs without a Google review request</p>
          </div>
          {needsReview.length > 0 && (
            <span className="bg-amber text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {needsReview.length}
            </span>
          )}
        </div>
        {needsReview.length === 0 ? (
          <div className="px-5 py-6 text-gray-400 text-sm text-center">
            All caught up! No pending review requests. 🎉
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {needsReview.map((job) => (
              <div key={job.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy text-sm truncate">{job.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {job.serviceType} · {job.status} ·{" "}
                    {job.scheduledAt
                      ? new Date(job.scheduledAt).toLocaleDateString()
                      : new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => copyReviewRequest(job)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 whitespace-nowrap"
                >
                  {copiedId === job.id ? "✓ Copied!" : "📋 Copy Request"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
