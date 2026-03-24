"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Job {
  id: string;
  jobNumber: string;
  serviceType: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  problemDescription: string;
  invoiceId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Lead: "bg-gray-100 text-gray-700",
  Called: "bg-gray-100 text-gray-700",
  Scheduled: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-700",
  Invoiced: "bg-purple-100 text-purple-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
};

const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJaxfsFK2hhkYRlSUOXJr5gfk";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/customer/jobs?email=${encodeURIComponent(session.user.email)}`)
        .then((r) => r.json())
        .then((data) => {
          setJobs(data.jobs || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-navy text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            <span className="text-amber">Grease</span> &amp;{" "}
            <span className="text-amber">Threads</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* User info */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt="Profile"
              className="w-14 h-14 rounded-full shrink-0"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-navy">{session.user.name}</h1>
            <p className="text-gray-500 text-sm">{session.user.email}</p>
          </div>
        </div>

        {/* Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-navy mb-4">Your Service Jobs</h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔧</div>
              <p className="text-gray-500">No jobs on file yet.</p>
              <p className="text-gray-400 text-sm mt-1">
                When you book a service, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const showInvoice = job.status === "Invoiced" && job.invoiceId;
                const showReview =
                  job.status === "Completed" || job.status === "Paid";
                return (
                  <div
                    key={job.id}
                    className="border border-gray-100 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-navy text-sm">
                          Job #{job.jobNumber}
                        </p>
                        <p className="text-gray-700 text-sm">{job.serviceType}</p>
                      </div>
                      <span
                        className={`shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    {job.problemDescription && (
                      <p className="text-gray-500 text-xs mb-2 line-clamp-2">
                        {job.problemDescription}
                      </p>
                    )}

                    <p className="text-gray-400 text-xs mb-3">
                      {job.scheduledAt
                        ? `Scheduled: ${new Date(job.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : `Created: ${new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>

                    {(showInvoice || showReview) && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        {showInvoice && (
                          <Link
                            href={`/invoice/${job.invoiceId}`}
                            className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                          >
                            View Invoice →
                          </Link>
                        )}
                        {showReview && (
                          <a
                            href={GOOGLE_REVIEW_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-amber bg-amber/10 px-3 py-1.5 rounded-lg hover:bg-amber/20 transition-colors"
                          >
                            ⭐ Leave a Google Review
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-navy mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <a
              href="tel:8125643719"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-amber hover:bg-amber/5 transition-colors"
            >
              <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Call Us</p>
                <p className="text-gray-500 text-xs">(812) 564-3719</p>
              </div>
            </a>

            <a
              href="https://calendar.app.google/NEBSdUFjbUY7yPxF6"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-amber hover:bg-amber/5 transition-colors"
            >
              <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Book New Service</p>
                <p className="text-gray-500 text-xs">Schedule online</p>
              </div>
            </a>

            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-amber hover:bg-amber/5 transition-colors"
            >
              <div className="w-10 h-10 bg-amber rounded-full flex items-center justify-center shrink-0 text-white text-lg">
                ⭐
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Leave a Google Review</p>
                <p className="text-gray-500 text-xs">We&apos;d really appreciate it!</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
