"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Job } from "@/lib/types";
import { HelpTip } from "@/components/HelpTip";

const V3_STATUSES = ["Lead", "Work Order", "En Route", "Working", "Job Done", "Final Invoice", "Payment", "Review"] as const;
const SERVICE_TYPES = ["HVAC", "Appliance Repair", "Commercial Kitchen", "Handyman", "Other"];
const LEAD_SOURCES = [
  { value: "direct", label: "Direct Call" },
  { value: "facebook", label: "Facebook" },
  { value: "google_search", label: "Google Search" },
  { value: "google_maps", label: "Google Maps" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website Contact Form" },
  { value: "other", label: "Other" },
];

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

/** Map legacy statuses to the new 8-step pipeline */
function mapStatus(s: string): string {
  switch (s) {
    case "Called":
    case "Scheduled":
    case "New":
      return "Work Order";
    case "In Progress":
    case "On Scene":
      return "Working";
    case "Completed":
    case "Complete":
      return "Job Done";
    case "Invoiced":
      return "Final Invoice";
    case "Paid":
      return "Payment";
    default:
      return s;
  }
}

const emptyJob = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  serviceType: "HVAC",
  problemDescription: "",
  address: "",
  scheduledAt: "",
  leadSource: "direct",
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({ ...emptyJob });
  const [saving, setSaving] = useState(false);
  const navigateAfterRef = useRef(false);
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string; email: string; address: string }[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch("/api/admin/customers").then((r) => r.json()).catch(() => []),
    ]).then(([j, c]) => {
      setJobs(j);
      setCustomers(c || []);
    }).finally(() => setLoading(false));
  }, []);

  // Open new job modal if ?new=1 in URL
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1" && !loading) {
      setShowNewModal(true);
      setForm({ ...emptyJob });
      setCustomerQuery("");
    }
  }, [loading]);

  // Close customer dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name && customerQuery.length >= 1 && c.name.toLowerCase().includes(customerQuery.toLowerCase())
  );

  function selectCustomer(c: typeof customers[0]) {
    setForm({
      ...form,
      customerName: c.name || "",
      customerPhone: c.phone || "",
      customerEmail: c.email || "",
      address: c.address || "",
    });
    setCustomerQuery(c.name || "");
    setShowCustomerDropdown(false);
  }

  const filtered = jobs
    .filter((j) => {
      if (filter === "All") return true;
      if (filter === "Warranty") return j.warrantyFlag;
      return mapStatus(j.status) === filter;
    })
    .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());

  const hasSpeech = typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setForm(f => ({
        ...f,
        problemDescription: f.problemDescription
          ? f.problemDescription + " " + transcript
          : transcript,
      }));
    };
    recognition.start();
  }

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const saved = await res.json();
      if (navigateAfterRef.current) {
        router.push(`/admin/jobs/${saved.id}`);
      } else {
        setShowNewModal(false);
        setForm({ ...emptyJob });
        setCustomerQuery("");
        // Refresh job list
        const updated = await fetch("/api/admin/jobs").then((r) => r.json());
        setJobs(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-500 p-4">Loading jobs...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-navy">Jobs</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowNewModal(true); setForm({ ...emptyJob }); setCustomerQuery(""); }}
            className="px-4 py-2.5 bg-amber text-white rounded-lg font-semibold text-sm active:scale-95 min-h-[44px]"
          >
            + New Job
          </button>
          <HelpTip text="Tap here to log a new service call. Fill in the customer name, their problem, and set the status to Called." />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-500">Status</span>
        <HelpTip text="The status shows where a job is in the workflow: Lead → Work Order → En Route → Working → Job Done → Final Invoice → Payment → Review" />
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {["All", ...V3_STATUSES, "Warranty"].map((s) => {
          const count = s === "All" ? jobs.length : s === "Warranty" ? jobs.filter((j) => j.warrantyFlag).length : jobs.filter((j) => mapStatus(j.status) === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                filter === s ? "bg-navy text-white" : "bg-gray-200 text-gray-600 active:bg-gray-300"
              }`}
            >
              {s} {s !== "All" && count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Job list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400">
            No jobs found. Create one with New Job.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((job) => {
              const displayStatus = mapStatus(job.status);
              return (
                <Link
                  key={job.id}
                  href={`/admin/jobs/${job.id}`}
                  className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 hover:bg-gray-50 transition-colors"
                >
                  {/* Status pill */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[displayStatus] || "bg-gray-100 text-gray-700"}`}>
                    {displayStatus}
                  </span>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy text-sm truncate">{job.customerName}</span>
                      {job.warrantyFlag && <span className="text-xs flex-shrink-0" title="Warranty Job">🛡️</span>}
                      {job.jobNumber && <span className="text-xs text-gray-400 flex-shrink-0">#{job.jobNumber}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {job.serviceType}
                      {job.scheduledAt && ` · ${new Date(job.scheduledAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  {/* Phone (visible on larger screens as tap target) */}
                  <a
                    href={`tel:${job.customerPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hidden sm:block text-xs text-blue-600 font-medium whitespace-nowrap"
                  >
                    {job.customerPhone}
                  </a>
                  {/* Chevron */}
                  <span className="text-gray-300 text-sm flex-shrink-0">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* New Job Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-navy">New Job</h2>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 text-2xl leading-none p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">×</button>
            </div>
            <form onSubmit={createJob} className="p-4 space-y-4">
              {/* Customer name with autocomplete */}
              <div ref={customerDropdownRef} className="relative">
                <label className="text-xs text-gray-500 block mb-1">Customer Name *</label>
                <input
                  required
                  value={customerQuery || form.customerName}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setForm({ ...form, customerName: e.target.value });
                    setShowCustomerDropdown(true);
                  }}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  placeholder="Customer name"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 active:bg-gray-100"
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  placeholder="Service address"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">Problem Description</label>
                  {hasSpeech && (
                    <button
                      type="button"
                      onClick={startVoice}
                      disabled={listening}
                      className={`text-sm px-2 py-1 rounded-lg font-medium transition-colors ${
                        listening
                          ? "bg-red-100 text-red-600 animate-pulse"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {listening ? "🔴 Listening..." : "🎤 Voice"}
                    </button>
                  )}
                </div>
                <textarea
                  value={form.problemDescription}
                  onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none"
                  placeholder="Describe the issue... or tap 🎤"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving || !form.customerName || !form.customerPhone}
                  onClick={() => { navigateAfterRef.current = false; }}
                  className="flex-1 border-2 border-amber text-amber font-bold py-3 rounded-xl text-sm disabled:opacity-50 active:scale-95 min-h-[48px] transition-transform"
                >
                  {saving && !navigateAfterRef.current ? "Creating..." : "Create Job"}
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.customerName || !form.customerPhone}
                  onClick={() => { navigateAfterRef.current = true; }}
                  className="flex-1 bg-amber text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 active:scale-95 min-h-[48px] transition-transform"
                >
                  {saving && navigateAfterRef.current ? "Opening..." : "Create & Open →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
