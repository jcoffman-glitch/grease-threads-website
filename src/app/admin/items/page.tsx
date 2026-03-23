"use client";

import { useEffect, useState } from "react";
import type { PriceListItem } from "@/lib/types";

const emptyItem: Partial<PriceListItem> = {
  name: "",
  description: "",
  defaultPrice: 0,
  price: 0,
  category: "",
  itemType: "Labor",
};

export default function ItemsPage() {
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [editing, setEditing] = useState<Partial<PriceListItem> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/items").then((r) => r.json()).then(setItems).finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/items", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const updated = await res.json();
    if (editing.id) {
      setItems(items.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      setItems([...items, updated]);
    }
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch("/api/admin/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems(items.filter((i) => i.id !== id));
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-navy">Price List</h1>
        <button onClick={() => setEditing({ ...emptyItem })} className="px-4 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark transition-colors text-sm font-medium">
          + Add Item
        </button>
      </div>

      {categories.length === 0 && items.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">No items yet. Add labor rates, diagnostic fees, and common parts.</div>
      ) : (
        <div className="space-y-6">
          {(categories.length > 0 ? categories : [""]).map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat || "uncategorized"}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">{cat || "Uncategorized"}</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden sm:table-cell">Description</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-navy">{item.name}</td>
                          <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{item.description}</td>
                          <td className="px-4 py-3">${(item.defaultPrice ?? item.price ?? 0).toFixed(2)}</td>
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
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-navy mb-4">{editing.id ? "Edit Item" : "Add Item"}</h2>
            <div className="space-y-3">
              <Field label="Name" value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Description" value={editing.description || ""} onChange={(v) => setEditing({ ...editing, description: v })} />
              <Field label="Price" type="number" value={String(editing.price || 0)} onChange={(v) => setEditing({ ...editing, price: parseFloat(v) || 0 })} />
              <Field label="Category" value={editing.category || ""} onChange={(v) => setEditing({ ...editing, category: v })} />
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
