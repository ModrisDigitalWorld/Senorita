import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { api, type ApiCoupon, formatPrice } from "@/lib/api";

const emptyForm = { code: "", type: "percentage", value: "", minOrder: "0", maxUses: "", expiresAt: "", isActive: true };

export default function AdminCoupons() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiCoupon | null>(null);
  const [form, setForm] = useState(typeof emptyForm);
  const [formData, setFormData] = useState<typeof emptyForm>({ ...emptyForm });
  const qc = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get<ApiCoupon[]>("/coupons"),
  });

  const save = useMutation({
    mutationFn: (data: any) => editing
      ? api.put(`/coupons/${editing.id}`, data)
      : api.post("/coupons", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-coupons"] }); closeForm(); },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: any) => api.put(`/coupons/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const openEdit = (c: ApiCoupon) => {
    setEditing(c);
    setFormData({ code: c.code, type: c.type, value: String(c.value), minOrder: String(c.minOrder), maxUses: c.maxUses ? String(c.maxUses) : "", expiresAt: c.expiresAt ? c.expiresAt.split("T")[0] : "", isActive: c.isActive });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setFormData({ ...emptyForm }); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({
      code: formData.code, type: formData.type, value: parseFloat(formData.value),
      minOrder: parseInt(formData.minOrder || "0"),
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      expiresAt: formData.expiresAt || null,
      isActive: formData.isActive,
    });
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(f => ({ ...f, [k]: e.target.value }));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#232323]">Coupons ({coupons.length})</h1>
        <button onClick={() => { setEditing(null); setFormData({ ...emptyForm }); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {["Code", "Type", "Value", "Min Order", "Uses", "Expires", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>)}
                  </tr>
                ))
              ) : coupons.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><span className="font-mono font-semibold text-[#232323]">{c.code}</span></td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{c.type}</td>
                  <td className="px-4 py-3 font-semibold">{c.type === "percentage" ? `${c.value}%` : formatPrice(c.value)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatPrice(c.minOrder)}</td>
                  <td className="px-4 py-3 text-gray-500">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle.mutate({ id: c.id, isActive: !c.isActive })}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${c.isActive ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-primary"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Delete coupon?")) del.mutate(c.id); }} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && coupons.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No coupons yet</p>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold">{editing ? "Edit Coupon" : "New Coupon"}</h3>
              <button onClick={closeForm}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Code</label>
                <input type="text" value={formData.code} onChange={set("code")} required placeholder="SAVE20"
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary uppercase font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Type</label>
                  <select value={formData.type} onChange={set("type")} className="w-full border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Value ({formData.type === "percentage" ? "%" : "₹"})</label>
                  <input type="number" value={formData.value} onChange={set("value")} required
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Min Order (₹)</label>
                  <input type="number" value={formData.minOrder} onChange={set("minOrder")}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Max Uses</label>
                  <input type="number" value={formData.maxUses} onChange={set("maxUses")} placeholder="Unlimited"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Expiry Date</label>
                <input type="date" value={formData.expiresAt} onChange={set("expiresAt")}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm">Active</span>
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={save.isPending} className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold disabled:opacity-50">
                  {save.isPending ? "Saving..." : editing ? "Update" : "Create"}
                </button>
                <button type="button" onClick={closeForm} className="px-4 py-2.5 border border-gray-200 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
