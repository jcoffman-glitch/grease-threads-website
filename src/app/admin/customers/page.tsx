"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Customer {
  id: string;
  google_id: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  preferred_contact: string | null;
  created_at: number | null;
}

function formatDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ContactBadge({ method }: { method: string | null }) {
  if (method === "text") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
      💬 Text
    </span>
  );
  if (method === "email") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
      📧 Email
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
      📞 Call
    </span>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      });
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(q) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleDelete(customer: Customer) {
    setDeleting(true);
    await fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    setConfirmDelete(null);
    setDeleting(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">👥 Customers</h1>
          {!loading && (
            <span className="px-2.5 py-1 bg-amber/20 text-amber-700 text-sm font-medium rounded-full">
              {customers.length} {customers.length === 1 ? "customer" : "customers"}
            </span>
          )}
        </div>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-gray-400">Loading customers…</div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-3">👥</div>
          {search ? (
            <p>No customers match &quot;{search}&quot;.</p>
          ) : (
            <p>No customers yet. Customers appear here when they sign in or book a service.</p>
          )}
        </div>
      )}

      {/* Desktop table */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/customers/${c.id}`}>
                    <td className="px-4 py-3 font-semibold text-navy"><Link href={`/admin/customers/${c.id}`} className="hover:underline">{c.name || "—"}</Link></td>
                    <td className="px-4 py-3 text-gray-600">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.city || "—"}</td>
                    <td className="px-4 py-3"><ContactBadge method={c.preferred_contact} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmDelete(c)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Delete customer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <Link key={c.id} href={`/admin/customers/${c.id}`} className="block bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-navy">{c.name || "—"}</p>
                    <p className="text-sm text-gray-600">{c.email || "—"}</p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="text-red-400 hover:text-red-600 p-1"
                    title="Delete customer"
                  >
                    🗑️
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                  <span>📞 {c.phone || "—"}</span>
                  <span>📍 {c.city || "—"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <ContactBadge method={c.preferred_contact} />
                  <span className="text-xs text-gray-400">Joined {formatDate(c.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold text-navy mb-2">Delete {confirmDelete.name || "customer"}?</h2>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
