import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-navy mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have admin access. This area is for Grease &amp; Threads staff only.
        </p>
        <Link
          href="/"
          className="inline-block bg-amber text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-amber-dark transition-colors"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}
