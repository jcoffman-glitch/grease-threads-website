"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SERVICE_TYPES = [
  { id: "HVAC / Heating & Cooling", label: "HVAC / Heating & Cooling", emoji: "🌡️" },
  { id: "Appliance Repair", label: "Appliance Repair", emoji: "🔧" },
  { id: "Commercial Kitchen Equipment", label: "Commercial Kitchen Equipment", emoji: "🍳" },
  { id: "Handyman Work", label: "Handyman Work", emoji: "🏠" },
  { id: "Not Sure", label: "Not Sure — Just Need Someone to Look", emoji: "❓" },
];

const TIMING_OPTIONS = [
  { id: "ASAP", label: "As soon as possible" },
  { id: "This week", label: "This week — afternoons or weekends" },
  { id: "Next week", label: "Next week is fine" },
  { id: "Flexible", label: "I'm flexible — just call me" },
];

interface Profile {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  preferred_contact: string;
}

export default function BookPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingToken, setTrackingToken] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  // If signed in with phone, contact step can be collapsed
  const [contactExpanded, setContactExpanded] = useState(false);

  const [form, setForm] = useState({
    serviceType: "",
    problemDescription: "",
    address: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    preferredTiming: "",
  });

  // Load profile on mount when signed in
  useEffect(() => {
    if (session?.user) {
      // Pre-fill name/email from session
      const nameParts = session.user.name?.split(" ") || [];
      setForm((f) => ({
        ...f,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: session.user.email || "",
      }));

      fetch("/api/customer/profile")
        .then((r) => r.json())
        .then((data: Profile) => {
          setProfile(data);
          if (data.phone) {
            setForm((f) => ({
              ...f,
              phone: data.phone || "",
              address: f.address || data.address || "",
            }));
          }
          setProfileLoaded(true);
        })
        .catch(() => setProfileLoaded(true));
    } else {
      setProfileLoaded(true);
    }
  }, [session]);

  // Whether signed-in user has phone on file (skip contact step)
  const hasProfilePhone = session && profileLoaded && profile?.phone;
  // Whether to show contact step (step 3 in the flow)
  // Show contact step if: not signed in, OR signed in but no phone, OR user chose to expand
  const showContactStep = !session || !hasProfilePhone || contactExpanded;

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Actual steps in flow: 1, 2, [3 if needed], 4
  // We store step as 1/2/3/4 where 3 = contact, 4 = review
  function canAdvance() {
    if (step === 1) return !!form.serviceType;
    if (step === 2) return !!form.problemDescription && !!form.address;
    if (step === 3) return !!form.phone && !!form.firstName;
    return true;
  }

  function nextStep() {
    if (step === 2 && !showContactStep) {
      setStep(4);
    } else {
      setStep((s) => s + 1);
    }
  }

  function prevStep() {
    if (step === 4 && !showContactStep) {
      setStep(2);
    } else {
      setStep((s) => s - 1);
    }
  }

  // Visible step number for progress bar
  const totalSteps = showContactStep ? 4 : 3;
  function getDisplayStep(s: number) {
    if (!showContactStep && s === 4) return 3;
    return s;
  }
  const currentDisplay = getDisplayStep(step);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const submitData = {
        ...form,
        firstName: session?.user?.name?.split(" ")[0] || form.firstName,
        lastName: session?.user?.name?.split(" ").slice(1).join(" ") || form.lastName,
        email: session?.user?.email || form.email,
        // Use profile phone if we skipped contact step
        phone: form.phone || profile?.phone || "",
      };

      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // If signed in and phone was entered (not from profile), save to profile
      if (session && form.phone && !hasProfilePhone) {
        fetch("/api/customer/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: form.phone,
            address: profile?.address || "",
            city: profile?.city || "",
            preferred_contact: profile?.preferred_contact || "call",
          }),
        }).catch(() => {});
      }

      setTrackingToken(data.token);
      setSubmitted(true);
      setTimeout(() => {
        router.push(`/track/${data.token}`);
      }, 4000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-navy mb-2">Request Received!</h1>
          <p className="text-gray-600 mb-4">
            We'll call you within a few hours to confirm your appointment.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Questions? Call us:{" "}
            <a href="tel:8125643719" className="text-amber-500 font-semibold">
              (812) 564-3719
            </a>
          </p>
          <Link
            href={`/track/${trackingToken}`}
            className="inline-block bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            Track Your Request →
          </Link>
          <p className="text-xs text-gray-400 mt-4">Redirecting automatically…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Book a Service Call</h1>
          <p className="text-amber-400 text-sm">Grease &amp; Threads • (812) 564-3719</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  currentDisplay >= s
                    ? "bg-amber-500 text-white"
                    : "bg-white/20 text-white/50"
                }`}
              >
                {s}
              </div>
              {s < totalSteps && (
                <div
                  className={`w-8 h-1 rounded ${
                    currentDisplay > s ? "bg-amber-500" : "bg-white/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">

          {/* Step 1: Service Type */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-navy mb-1">What can we help with?</h2>
              <p className="text-gray-500 text-sm mb-5">Select the type of service you need.</p>
              <div className="space-y-3">
                {SERVICE_TYPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => set("serviceType", s.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      form.serviceType === s.id
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:border-amber-300"
                    }`}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <span className="font-semibold text-navy">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Problem Description */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-navy mb-1">What's going on?</h2>
              <p className="text-gray-500 text-sm mb-5">The more detail, the better — it helps us come prepared.</p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-navy mb-1">
                  Tell us what's going on <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy focus:border-amber-500 outline-none resize-none"
                  rows={5}
                  placeholder="e.g. My AC stopped blowing cold air about 3 days ago. The unit is running but it's just pushing warm air…"
                  value={form.problemDescription}
                  onChange={(e) => set("problemDescription", e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-navy mb-1">
                  Where is the job? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy focus:border-amber-500 outline-none"
                  placeholder="123 Main St, Carlisle, IN"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-1">
                  Got a photo? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">
                  <p>Photo upload coming soon.</p>
                  <p className="text-xs mt-1">Our tech may ask you to text a photo to (812) 564-3719 — it helps a lot!</p>
                </div>
              </div>

              {/* Signed-in with phone: show collapsed contact card */}
              {hasProfilePhone && !contactExpanded && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="text-sm text-navy">
                    <span className="font-semibold">Booking as</span>{" "}
                    {profile?.name || session?.user?.name} · {profile?.phone} ·{" "}
                    Prefers {profile?.preferred_contact === "call" ? "📞 Call" : profile?.preferred_contact === "text" ? "💬 Text" : "📧 Email"}
                  </div>
                  <button
                    onClick={() => setContactExpanded(true)}
                    className="text-xs text-amber-600 font-semibold hover:text-amber-500 ml-3 shrink-0"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && showContactStep && (
            <div>
              <h2 className="text-xl font-bold text-navy mb-1">How do we reach you?</h2>
              <p className="text-gray-500 text-sm mb-5">We'll call to confirm your appointment.</p>

              {session && !hasProfilePhone && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 mb-4">
                  💡 We'll save your phone number to your profile for next time.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy focus:border-amber-500 outline-none"
                    value={form.firstName}
                    readOnly={!!session?.user?.name}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy focus:border-amber-500 outline-none"
                    value={form.lastName}
                    readOnly={!!session?.user?.name}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-navy mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy focus:border-amber-500 outline-none"
                  placeholder="(812) 555-1234"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-navy mb-1">
                  Email <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-navy focus:border-amber-500 outline-none"
                  placeholder="you@example.com"
                  value={form.email}
                  readOnly={!!session?.user?.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">When works for you?</label>
                <div className="space-y-2">
                  {TIMING_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set("preferredTiming", t.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all text-sm ${
                        form.preferredTiming === t.id
                          ? "border-amber-500 bg-amber-50 font-semibold text-navy"
                          : "border-gray-200 hover:border-amber-300 text-gray-700"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          form.preferredTiming === t.id
                            ? "border-amber-500 bg-amber-500"
                            : "border-gray-300"
                        }`}
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review + Submit */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-navy mb-1">Review Your Request</h2>
              <p className="text-gray-500 text-sm mb-5">Everything look right? Hit submit when you're ready.</p>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28 flex-shrink-0">Service:</span>
                  <span className="font-semibold text-navy">{form.serviceType}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28 flex-shrink-0">Problem:</span>
                  <span className="text-navy">{form.problemDescription}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28 flex-shrink-0">Location:</span>
                  <span className="text-navy">{form.address}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28 flex-shrink-0">Name:</span>
                  <span className="text-navy">
                    {session?.user?.name || `${form.firstName} ${form.lastName}`.trim()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28 flex-shrink-0">Phone:</span>
                  <span className="text-navy">{form.phone || profile?.phone || "—"}</span>
                </div>
                {(form.email || session?.user?.email) && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 flex-shrink-0">Email:</span>
                    <span className="text-navy">{session?.user?.email || form.email}</span>
                  </div>
                )}
                {form.preferredTiming && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 flex-shrink-0">Timing:</span>
                    <span className="text-navy">
                      {TIMING_OPTIONS.find((t) => t.id === form.preferredTiming)?.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-5">
                <strong>Note:</strong> Service calls are scheduled after 3pm on weekdays and anytime on weekends. We'll confirm exact timing when we call.
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:border-gray-300 transition"
              >
                ← Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canAdvance()}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-white font-bold py-3 rounded-xl transition"
              >
                {submitting ? "Submitting…" : "Submit Request ✓"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Questions? Call{" "}
          <a href="tel:8125643719" className="text-amber-400">
            (812) 564-3719
          </a>
        </p>
      </div>
    </div>
  );
}
