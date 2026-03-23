"use client";

import { useEffect, useState } from "react";
import type { InventoryItem } from "@/lib/types";

const emptyItem: Omit<InventoryItem, "id"> = {
  partName: "",
  partNumber: "",
  category: "",
  qty: 0,
  reorderPoint: 5,
  unitCost: 0,
  supplier: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState<Partial<InventoryItem> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/inventory").then((r) => r.json()).then(setItems).finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/inventory", {
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
    if (!confirm("Delete this part?")) return;
    await fetch("/api/admin/inventory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems(items.filter((i) => i.id !== id));
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-navy">Parts Inventory</h1>
        <button onClick={() => setEditing({ ...emptyItem })} className="px-4 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark transition-colors text-sm font-medium">
          + Add Part
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3">Part Name</th>
              <th className="px-4 py-3 hidden sm:table-cell">Part #</th>
              <th className="px-4 py-3 hidden md:table-cell">Category</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3 hidden sm:table-cell">Reorder</th>
              <th className="px-4 py-3 hidden md:table-cell">Cost</th>
              <th className="px-4 py-3 hidden lg:table-cell">Supplier</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No parts in inventory</td></tr>
            ) : (
              items.map((item) => {
                const lowStock = item.qty <= item.reorderPoint;
                return (
                  <tr key={item.id} className={`border-b border-gray-50 ${lowStock ? "bg-red-50" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3 font-medium text-navy">
                      {item.partName}
                      {lowStock && <span className="ml-2 text-xs text-red-600 font-medium">LOW</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{item.partNumber}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{item.category}</td>
                    <td className={`px-4 py-3 font-medium ${lowStock ? "text-red-600" : ""}`}>{item.qty}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{item.reorderPoint}</td>
                    <td className="px-4 py-3 hidden md:table-cell">${item.unitCost}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{item.supplier}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing({ ...item })} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                        <button onClick={() => remove(item.id)} className="text-red-600 hover:text-red-800 text-xs">Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-navy mb-4">{editing.id ? "Edit Part" : "Add Part"}</h2>
            <div className="space-y-3">
              <Field label="Part Name" value={editing.partName || ""} onChange={(v) => setEditing({ ...editing, partName: v })} />
              <Field label="Part Number" value={editing.partNumber || ""} onChange={(v) => setEditing({ ...editing, partNumber: v })} />
              <Field label="Category" value={editing.category || ""} onChange={(v) => setEditing({ ...editing, category: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity" type="number" value={String(editing.qty || 0)} onChange={(v) => setEditing({ ...editing, qty: parseInt(v) || 0 })} />
                <Field label="Reorder Point" type="number" value={String(editing.reorderPoint || 0)} onChange={(v) => setEditing({ ...editing, reorderPoint: parseInt(v) || 0 })} />
              </div>
              <Field label="Unit Cost" type="number" value={String(editing.unitCost || 0)} onChange={(v) => setEditing({ ...editing, unitCost: parseFloat(v) || 0 })} />
              <Field label="Supplier" value={editing.supplier || ""} onChange={(v) => setEditing({ ...editing, supplier: v })} />
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
