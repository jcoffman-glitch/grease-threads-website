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
  problemDescription: string;
}

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

  const statusColors: Record<string, string> = {
    Lead: "bg-gray-100 text-gray-700",
    Scheduled: "bg-blue-100 text-blue-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Completed: "bg-green-100 text-green-700",
    Invoiced: "bg-purple-100 text-purple-700",
    Paid: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* User info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt="Profile"
                className="w-14 h-14 rounded-full"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-navy">
                {session.user.name}
              </h1>
              <p className="text-gray-500 text-sm">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-navy mb-4">Your Jobs</h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔧</div>
              <p className="text-gray-500">No jobs on file yet.</p>
              <p className="text-gray-400 text-sm mt-1">
                When you book a service, it will appear here.
              </p>
              <a
                href="tel:8125643719"
                className="inline-block mt-4 bg-amber text-white font-semibold px-5 py-2 rounded-lg hover:bg-amber-dark transition-colors text-sm"
              >
                Call to Schedule: (812) 564-3719
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-100 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-navy text-sm">
                        #{job.jobNumber}
                      </p>
                      <p className="text-gray-700 text-sm mt-0.5">
                        {job.serviceType}
                      </p>
                      {job.problemDescription && (
                        <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                          {job.problemDescription}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[job.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {job.status}
                      </span>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(job.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
