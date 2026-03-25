"use client";

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Print button — hidden when printing */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-navy">Help Guide</h1>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-navy text-white rounded-lg font-semibold text-sm active:scale-95 min-h-[44px]"
        >
          🖨️ Print This Page
        </button>
      </div>

      {/* Print-only title */}
      <h1 className="hidden print:block text-3xl font-bold text-navy mb-6">
        Grease &amp; Threads — Help Guide
      </h1>

      <div className="space-y-8 text-lg text-gray-700">

        {/* Getting Started */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">Getting Started</h2>
          <p className="mb-2">
            Open the app on your phone or computer and tap <strong>Sign in with Google</strong>.
          </p>
          <p className="mb-2">
            Use your Google account: <strong className="text-amber-700">jcoffman@greasethreads.com</strong>
          </p>
          <p>
            Once you&apos;re signed in, you&apos;ll land on the <strong>Dashboard</strong>. From there you can see
            your upcoming jobs, recent activity, and navigate to any section.
          </p>
        </section>

        {/* New Call Workflow */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">📞 New Call Workflow</h2>
          <p className="mb-3">When a customer calls, follow these steps:</p>
          <ol className="list-decimal list-inside space-y-3 text-lg">
            <li>Tap the <strong>+ New Job</strong> button (orange button, top right of the Jobs page)</li>
            <li>Type the <strong>customer&apos;s name</strong> — if they&apos;re a past customer, their info will auto-fill</li>
            <li>Fill in their <strong>phone number</strong>, <strong>address</strong>, and describe the <strong>problem</strong></li>
            <li>The job starts as a <strong>Lead</strong> — move it to <strong>Work Order</strong> once you confirm the call</li>
            <li>Tap <strong>Create Job</strong></li>
          </ol>
        </section>

        {/* Scheduling a Job */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">📅 Scheduling a Job</h2>
          <ol className="list-decimal list-inside space-y-3 text-lg">
            <li>Open the job from the <strong>Jobs</strong> list</li>
            <li>Scroll to <strong>Scheduled</strong> and pick the <strong>date and time</strong></li>
            <li>The job will show up on the <strong>Schedule</strong> page so you know when to be there</li>
          </ol>
        </section>

        {/* Heading Out */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">🚗 Heading Out</h2>
          <ol className="list-decimal list-inside space-y-3 text-lg">
            <li>Open the job you&apos;re heading to</li>
            <li>Tap the <strong>En Route</strong> status in the status bar at the top</li>
            <li>The customer gets a notification that you&apos;re on your way</li>
          </ol>
        </section>

        {/* On the Job */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">🔧 On the Job</h2>
          <ol className="list-decimal list-inside space-y-3 text-lg">
            <li>Tap <strong>Working</strong> in the status bar when you arrive</li>
            <li>Add <strong>parts</strong> you use — tap <strong>+ Add Item</strong> in the Parts &amp; Labor section</li>
            <li>Add your <strong>labor time</strong> the same way</li>
            <li>Use the <strong>Internal Notes</strong> box for anything you want to remember (customer never sees these)</li>
            <li>If you enter the <strong>model number</strong>, you can tap <strong>Find Manual</strong> to look it up</li>
          </ol>
        </section>

        {/* Finishing Up */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">✅ Finishing Up</h2>
          <ol className="list-decimal list-inside space-y-3 text-lg">
            <li>When the work is done, tap <strong>Job Done</strong> in the status bar</li>
            <li>Review your parts and labor — make sure everything is listed</li>
            <li>Tap <strong>Generate Invoice</strong> at the bottom of the page</li>
            <li>Review the invoice total, then advance to <strong>Final Invoice</strong></li>
          </ol>
        </section>

        {/* Getting Paid */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">💰 Getting Paid</h2>
          <ol className="list-decimal list-inside space-y-3 text-lg">
            <li>Once the customer pays, tap <strong>Payment</strong> in the status bar</li>
            <li>The job moves to <strong>Review</strong> for a final check</li>
            <li>Tap <strong>Mark as Reviewed</strong> when everything looks good — you&apos;re done!</li>
          </ol>
        </section>

        {/* Status Flow */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">Status Flow</h2>
          <p className="mb-4 text-lg">Every job moves through these steps, left to right:</p>
          <div className="flex flex-wrap items-center gap-2 text-base">
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-gray-200 text-gray-800">Lead</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-blue-200 text-blue-800">Work Order</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-yellow-200 text-yellow-800">En Route</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-orange-200 text-orange-800">Working</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-green-200 text-green-800">Job Done</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-purple-200 text-purple-800">Final Invoice</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-teal-200 text-teal-800">Payment</span>
            <span className="text-gray-400">→</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-200 text-indigo-800">Review</span>
          </div>
        </section>

        {/* Quick Tips */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-navy mb-4">Quick Tips</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-3 pr-4 font-bold text-navy">Situation</th>
                  <th className="py-3 font-bold text-navy">What to Do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 pr-4">Customer calls back about the same issue</td>
                  <td className="py-3">Open the original job (don&apos;t create a new one). Add notes and reschedule.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Need to look up a part</td>
                  <td className="py-3">Enter the model number on the job, then tap <strong>Find Manual</strong>.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Forgot to add a part before invoicing</td>
                  <td className="py-3">You can still add parts after the invoice — just regenerate it.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Warranty job</td>
                  <td className="py-3">Check the <strong>Rely Home Warranty</strong> box on the job. A purple section appears for warranty details.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Can&apos;t find a customer</td>
                  <td className="py-3">Start typing their name in the New Job form — past customers show up automatically.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Want to call the customer</td>
                  <td className="py-3">Tap their phone number on the job — it dials automatically.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Need directions</td>
                  <td className="py-3">Tap <strong>Open in Maps</strong> under the address on the job.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">App looks weird on your phone</td>
                  <td className="py-3">Try tapping the menu (three lines, top left) to open the sidebar.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, .print\\:hidden, footer, header, aside,
          [class*="BottomNav"], [class*="InstallBanner"],
          [class*="safe-area"] {
            display: none !important;
          }
          body {
            background: white !important;
            font-size: 14pt;
          }
          main {
            padding: 0 !important;
            overflow: visible !important;
          }
          section {
            break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  );
}
