"use client";

import { useEffect, useState } from "react";
import type { ServiceLogEntry } from "@/lib/types";

const emptyEntry: Omit<ServiceLogEntry, "id"> = {
  dateTime: new Date().toISOString().slice(0, 16),
  customer: "",
  address: "",
  equipmentType: "",
  problem: "",
  partsUsed: "",
  timeSpent: "",
  outcome: "",
};

export default function ServiceLogPage() {
  const [entries, setEntries] = useState<ServiceLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<ServiceLogEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/service-log").then((r) => r.json()).then(setEntries).finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter((e) =>
    [e.customer, e.address, e.equipmentType, e.problem, e.outcome]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/service-log", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const updated = await res.json();
    if (editing.id) {
      setEntries(entries.map((en) => (en.id === updated.id ? updated : en)));
    } else {
      setEntries([...entries, updated]);
    }
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    await fetch("/api/admin/service-log", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEntries(entries.filter((e) => e.id !== id));
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-navy">Service Log</h1>
        <button onClick={() => setEditing({ ...emptyEntry })} className="px-4 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark transition-colors text-sm font-medium">
          + New Entry
        </button>
      </div>

      <input
        type="text"
        placeholder="Search service logs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-gray-900"
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">No entries found</div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-navy">{entry.customer}</p>
                  <p className="text-xs text-gray-500">{new Date(entry.dateTime).toLocaleString()} — {entry.address}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ ...entry })} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                  <button onClick={() => remove(entry.id)} className="text-red-600 hover:text-red-800 text-xs">Del</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Equipment:</span> {entry.equipmentType}</div>
                <div><span className="text-gray-500">Time:</span> {entry.timeSpent}</div>
                <div className="col-span-2"><span className="text-gray-500">Problem:</span> {entry.problem}</div>
                <div className="col-span-2"><span className="text-gray-500">Parts:</span> {entry.partsUsed || "None"}</div>
                <div className="col-span-2"><span className="text-gray-500">Outcome:</span> {entry.outcome}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-navy mb-4">{editing.id ? "Edit Entry" : "New Entry"}</h2>
            <div className="space-y-3">
              <Field label="Date/Time" type="datetime-local" value={editing.dateTime || ""} onChange={(v) => setEditing({ ...editing, dateTime: v })} />
              <Field label="Customer" value={editing.customer || ""} onChange={(v) => setEditing({ ...editing, customer: v })} />
              <Field label="Address" value={editing.address || ""} onChange={(v) => setEditing({ ...editing, address: v })} />
              <Field label="Equipment Type" value={editing.equipmentType || ""} onChange={(v) => setEditing({ ...editing, equipmentType: v })} />
              <TextArea label="Problem" value={editing.problem || ""} onChange={(v) => setEditing({ ...editing, problem: v })} />
              <Field label="Parts Used" value={editing.partsUsed || ""} onChange={(v) => setEditing({ ...editing, partsUsed: v })} />
              <Field label="Time Spent" value={editing.timeSpent || ""} onChange={(v) => setEditing({ ...editing, timeSpent: v })} />
              <TextArea label="Outcome" value={editing.outcome || ""} onChange={(v) => setEditing({ ...editing, outcome: v })} />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" className="flex-1 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark font-medium">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" rows={2} />
    </div>
  );
}
