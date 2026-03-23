import { dbGetJobByToken } from "@/lib/db";

const STATUS_STEPS = ["Lead", "Called", "Scheduled", "In Progress", "Completed"] as const;

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);
  if (status === "Invoiced" || status === "Paid") return STATUS_STEPS.length - 1;
  return idx;
}

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = await dbGetJobByToken(token);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Job Not Found</h1>
          <p className="text-gray-500 text-sm">This tracking link may be expired or incorrect. Please contact Grease & Threads.</p>
          <p className="mt-4 text-sm font-medium text-gray-700">📞 <a href="tel:8125643719" className="text-amber underline">812-564-3719</a></p>
        </div>
      </div>
    );
  }

  const stepIdx = getStepIndex(job.status);
  const isOnTheWay = job.status === "In Progress";
  const isComplete = job.status === "Completed" || job.status === "Invoiced" || job.status === "Paid";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber/10 rounded-xl flex items-center justify-center text-2xl">🔧</div>
          <div>
            <h1 className="font-bold text-gray-900">Grease & Threads</h1>
            <p className="text-xs text-gray-500">Job #{job.jobNumber}</p>
          </div>
        </div>

        {/* On the way banner */}
        {isOnTheWay && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 text-center">
            <div className="text-3xl mb-1">🚗</div>
            <p className="font-bold text-yellow-800">Technician is on the way!</p>
            <p className="text-xs text-yellow-700 mt-1">Please have the equipment accessible.</p>
          </div>
        )}

        {/* Complete banner */}
        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-center">
            <div className="text-3xl mb-1">✅</div>
            <p className="font-bold text-green-800">Service Complete</p>
            <p className="text-xs text-green-700 mt-1">Thank you for choosing Grease & Threads!</p>
          </div>
        )}

        {/* Customer info */}
        <div className="mb-5">
          <p className="text-sm text-gray-600">Hi, <span className="font-semibold text-gray-900">{job.customerName.split(" ")[0]}</span>! Here&apos;s your job status.</p>
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-gray-900">{job.serviceType}</span>
          </div>
          {job.scheduledAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Scheduled</span>
              <span className="font-medium text-gray-900">{new Date(job.scheduledAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Issue</span>
            <span className="font-medium text-gray-900 text-right max-w-[200px]">{job.problemDescription || "—"}</span>
          </div>
        </div>

        {/* Status timeline */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Progress</p>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    idx <= stepIdx ? "bg-amber text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {idx < stepIdx ? "✓" : idx + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 hidden sm:block text-center leading-tight max-w-[60px]">{step}</span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${idx < stepIdx ? "bg-amber" : "bg-gray-100"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Questions? Give us a call.</p>
          <a href="tel:8125643719" className="text-amber font-semibold text-sm">📞 812-564-3719</a>
        </div>
      </div>
    </div>
  );
}
