"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
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

interface Profile {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  preferred_contact: string;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", address: "", city: "", preferred_contact: "call" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

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

      fetch("/api/customer/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setEditForm({
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            preferred_contact: data.preferred_contact || "call",
          });
          setProfileLoading(false);
        })
        .catch(() => setProfileLoading(false));
    }
  }, [session]);

  async function saveProfile() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setProfile((p) => p ? { ...p, ...editForm } : p);
        setEditing(false);
        setSaveMsg("✅ Profile saved!");
        setTimeout(() => setSaveMsg(""), 4000);
      } else {
        setSaveMsg("❌ Save failed. Try again.");
      }
    } catch {
      setSaveMsg("❌ Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const missingPhone = !profileLoading && profile && !profile.phone;

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

        {/* Missing phone banner */}
        {missingPhone && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <p className="text-yellow-900 font-semibold text-sm">Add your phone number to make booking faster</p>
              <p className="text-yellow-700 text-xs mt-0.5">
                We&apos;ll pre-fill it next time you book a service.{" "}
                <button
                  onClick={() => {
                    profileRef.current?.scrollIntoView({ behavior: "smooth" });
                    setEditing(true);
                  }}
                  className="underline font-semibold"
                >
                  Add it now →
                </button>
              </p>
            </div>
          </div>
        )}

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

        {/* My Profile */}
        <div ref={profileRef} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">My Profile</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-amber-600 hover:text-amber-500 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {profileLoading ? (
            <p className="text-gray-400 text-sm">Loading profile...</p>
          ) : (
            <div className="space-y-4">
              {/* Read-only fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Name</p>
                  <p className="text-sm font-medium text-navy">{profile?.name || session.user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="text-sm font-medium text-navy break-all">{profile?.email || session.user.email}</p>
                </div>
              </div>

              {editing ? (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-semibold">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy text-sm focus:border-amber-500 outline-none"
                      placeholder="(812) 555-1234"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-semibold">Address</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy text-sm focus:border-amber-500 outline-none"
                      placeholder="123 Main St"
                      value={editForm.address}
                      onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-semibold">City</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy text-sm focus:border-amber-500 outline-none"
                      placeholder="Carlisle"
                      value={editForm.city}
                      onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 font-semibold">Preferred Contact Method</label>
                    <div className="flex gap-3">
                      {[
                        { id: "call", label: "📞 Call" },
                        { id: "text", label: "💬 Text" },
                        { id: "email", label: "📧 Email" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setEditForm((f) => ({ ...f, preferred_contact: opt.id }))}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                            editForm.preferred_contact === opt.id
                              ? "border-amber-500 bg-amber-50 text-amber-800"
                              : "border-gray-200 text-gray-600 hover:border-amber-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setEditing(false); setEditForm({ phone: profile?.phone || "", address: profile?.address || "", city: profile?.city || "", preferred_contact: profile?.preferred_contact || "call" }); }}
                      className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-white font-bold py-2.5 rounded-xl transition text-sm"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                      <p className="text-sm font-medium text-navy">{profile?.phone || <span className="text-gray-400 italic">Not set</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">City</p>
                      <p className="text-sm font-medium text-navy">{profile?.city || <span className="text-gray-400 italic">Not set</span>}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Address</p>
                      <p className="text-sm font-medium text-navy">{profile?.address || <span className="text-gray-400 italic">Not set</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Preferred Contact</p>
                      <p className="text-sm font-medium text-navy capitalize">
                        {profile?.preferred_contact === "call" ? "📞 Call" : profile?.preferred_contact === "text" ? "💬 Text" : "📧 Email"}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {saveMsg && (
                <p className="text-sm font-semibold text-center">{saveMsg}</p>
              )}
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
              href="/book"
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
