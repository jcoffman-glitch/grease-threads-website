"use client";

import { useEffect, useState } from "react";
import type { PriceListItem } from "@/lib/types";

const ITEM_TYPES = ["Labor", "Part", "Fee"] as const;

const TYPE_COLORS: Record<string, string> = {
  Labor: "bg-blue-100 text-blue-700",
  Part: "bg-orange-100 text-orange-700",
  Fee: "bg-purple-100 text-purple-700",
};

const emptyItem = {
  name: "",
  description: "",
  defaultPrice: 0,
  itemType: "Labor" as const,
};

export default function PriceListPage() {
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [editing, setEditing] = useState<Partial<PriceListItem> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/price-list").then((r) => r.json()).then(setItems).finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/price-list", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const saved = await res.json();
    if (editing.id) {
      setItems(items.map((i) => (i.id === saved.id ? saved : i)));
    } else {
      setItems([...items, saved]);
    }
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch("/api/admin/price-list", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(items.filter((i) => i.id !== id));
  }

  if (loading) return <div className="text-gray-500 p-4">Loading price list...</div>;

  const byType = ITEM_TYPES.map((type) => ({
    type,
    items: items.filter((i) => i.itemType === type),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Price List</h1>
        <button onClick={() => setEditing({ ...emptyItem })} className="px-4 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark text-sm font-medium">
          + Add Item
        </button>
      </div>

      {byType.map(({ type, items: typeItems }) => typeItems.length > 0 && (
        <div key={type} className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">{type}</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Description</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {typeItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{item.description || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      ${(item.defaultPrice || item.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[item.itemType] || "bg-gray-100 text-gray-700"}`}>
                        {item.itemType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing({ ...item })} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                        <button onClick={() => remove(item.id)} className="text-red-600 hover:text-red-800 text-xs">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-12 text-center text-gray-400">
          No price list items yet. Add standard rates and common parts here.
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-navy mb-5">{editing.id ? "Edit Item" : "Add Item"}</h2>
            <div className="space-y-3">
              <Field label="Name" value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} required />
              <Field label="Description (optional)" value={editing.description || ""} onChange={(v) => setEditing({ ...editing, description: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Default Price ($)" type="number" value={String(editing.defaultPrice || editing.price || 0)} onChange={(v) => setEditing({ ...editing, defaultPrice: parseFloat(v) || 0 })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={editing.itemType || "Labor"} onChange={(e) => setEditing({ ...editing, itemType: e.target.value as PriceListItem["itemType"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
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

function Field({ label, type = "text", value, onChange, required }: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
    </div>
  );
}
