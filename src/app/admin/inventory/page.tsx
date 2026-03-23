"use client";

import { useEffect, useState } from "react";
import type { InventoryItem } from "@/lib/types";

const CATEGORIES = ["General", "HVAC", "Appliance", "Refrigerant", "Electrical", "Tools", "Other"];

const emptyItem = {
  partNumber: "",
  description: "",
  category: "General",
  qtyOnHand: 0,
  reorderPoint: 2,
  unitCost: 0,
  retailPrice: 0,
  supplier: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState<Partial<InventoryItem> | null>(null);
  const [receiveId, setReceiveId] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);

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
    const saved = await res.json();
    if (editing.id) {
      setItems(items.map((i) => (i.id === saved.id ? saved : i)));
    } else {
      setItems([...items, saved]);
    }
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this part?")) return;
    await fetch("/api/admin/inventory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(items.filter((i) => i.id !== id));
  }

  async function receiveStock(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = (item.qtyOnHand ?? item.qty ?? 0) + receiveQty;
    const res = await fetch("/api/admin/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, qtyOnHand: newQty }),
    });
    const updated = await res.json();
    setItems(items.map((i) => (i.id === id ? updated : i)));
    setReceiveId(null);
    setReceiveQty(1);
  }

  const displayed = filterLowStock
    ? items.filter((i) => (i.qtyOnHand ?? i.qty ?? 0) <= i.reorderPoint)
    : items;

  const lowStockCount = items.filter((i) => (i.qtyOnHand ?? i.qty ?? 0) <= i.reorderPoint).length;

  if (loading) return <div className="text-gray-500 p-4">Loading inventory...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Parts Inventory</h1>
          {lowStockCount > 0 && (
            <p className="text-xs text-red-600 mt-0.5">⚠️ {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} at or below reorder point</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${filterLowStock ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {filterLowStock ? "Show All" : "⚠️ Low Stock Only"}
          </button>
          <button onClick={() => setEditing({ ...emptyItem })} className="px-4 py-2 bg-amber text-white rounded-lg hover:bg-amber-dark text-sm font-medium">
            + Add Part
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
              <th className="px-4 py-3">Part #</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 text-right">On Hand</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Reorder At</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">Cost</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">Retail</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No inventory items</td></tr>
            ) : (
              displayed.map((item) => {
                const qty = item.qtyOnHand ?? item.qty ?? 0;
                const isLow = qty <= item.reorderPoint;
                return (
                  <tr key={item.id} className={`border-b border-gray-50 ${isLow ? "bg-red-50" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3 font-mono text-xs">{item.partNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.description || item.partName}</div>
                      {item.supplier && <div className="text-xs text-gray-400">{item.supplier}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{item.category}</td>
                    <td className={`px-4 py-3 text-right font-bold ${isLow ? "text-red-600" : "text-gray-800"}`}>
                      {qty} {isLow && "⚠️"}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-500">{item.reorderPoint}</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-gray-600">${(item.unitCost || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-gray-800">${(item.retailPrice || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setReceiveId(item.id); setReceiveQty(1); }}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">+Stock</button>
                        <button onClick={() => setEditing({ ...item })} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">Edit</button>
                        <button onClick={() => remove(item.id)} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200">Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Receive Stock Modal */}
      {receiveId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-navy mb-4">Receive Stock</h2>
            <p className="text-sm text-gray-600 mb-4">{items.find((i) => i.id === receiveId)?.description}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
              <input type="number" value={receiveQty} onChange={(e) => setReceiveQty(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" min={1} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => receiveStock(receiveId)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Add Stock</button>
              <button onClick={() => setReceiveId(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg font-bold text-navy mb-5">{editing.id ? "Edit Part" : "Add Part"}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Part Number" value={editing.partNumber || ""} onChange={(v) => setEditing({ ...editing, partNumber: v })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={editing.category || "General"} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Description" value={editing.description || editing.partName || ""} onChange={(v) => setEditing({ ...editing, description: v })} />
              <Field label="Supplier (optional)" value={editing.supplier || ""} onChange={(v) => setEditing({ ...editing, supplier: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Qty On Hand" type="number" value={String(editing.qtyOnHand ?? editing.qty ?? 0)} onChange={(v) => setEditing({ ...editing, qtyOnHand: parseFloat(v) || 0 })} />
                <Field label="Reorder Point" type="number" value={String(editing.reorderPoint || 2)} onChange={(v) => setEditing({ ...editing, reorderPoint: parseFloat(v) || 0 })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Unit Cost ($)" type="number" value={String(editing.unitCost || 0)} onChange={(v) => setEditing({ ...editing, unitCost: parseFloat(v) || 0 })} />
                <Field label="Retail Price ($)" type="number" value={String(editing.retailPrice || 0)} onChange={(v) => setEditing({ ...editing, retailPrice: parseFloat(v) || 0 })} />
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

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
    </div>
  );
}
