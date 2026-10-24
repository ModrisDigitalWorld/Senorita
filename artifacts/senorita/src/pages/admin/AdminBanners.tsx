import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Image } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { api } from "@/lib/api";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type BannerPosition = "hero" | "promo" | "collection";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = {
  title: "", subtitle: "", image: "", link: "", buttonText: "",
  position: "hero" as BannerPosition, sortOrder: "0", isActive: true,
};

const POSITIONS: { value: BannerPosition; label: string; desc: string }[] = [
  { value: "hero", label: "Hero Banner", desc: "Full-width homepage hero" },
  { value: "promo", label: "Promo Banner", desc: "Promotional strip / section" },
  { value: "collection", label: "Collection Banner", desc: "Category / collection tile" },
];

export default function AdminBanners() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const qc = useQueryClient();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => api.get<Banner[]>("/banners"),
  });

  const save = useMutation({
    mutationFn: (data: any) => editing
      ? api.put(`/banners/${editing.id}`, data)
      : api.post("/banners", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); closeForm(); },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const toggle = useMutation({
    mutationFn: (b: Banner) => api.put(`/banners/${b.id}`, { ...b, isActive: !b.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle || "", image: b.image, link: b.link || "", buttonText: b.buttonText || "", position: b.position, sortOrder: String(b.sortOrder), isActive: b.isActive });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) { alert("Please upload a banner image"); return; }
    save.mutate({
      title: form.title, subtitle: form.subtitle || null, image: form.image,
      link: form.link || null, buttonText: form.buttonText || null,
      position: form.position, sortOrder: parseInt(form.sortOrder || "0"),
      isActive: form.isActive,
    });
  };

  const grouped = POSITIONS.map(p => ({
    ...p,
    items: banners.filter(b => b.position === p.value).sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#232323]">Banners</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage homepage hero, promo, and collection banners</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[#232323]">{group.label}</h2>
                <span className="text-xs text-gray-400">— {group.desc}</span>
                <span className="ml-auto text-xs text-gray-400">{group.items.length} banner{group.items.length !== 1 ? "s" : ""}</span>
              </div>
              {group.items.length === 0 ? (
                <div
                  onClick={openNew}
                  className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm text-gray-400 flex items-center gap-2"><Plus size={14} /> Add a {group.label.toLowerCase()}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map(banner => (
                    <div key={banner.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${!banner.isActive ? "opacity-60 border-gray-100" : "border-gray-100"}`}>
                      <div className="relative aspect-[16/7] bg-gray-100">
                        {banner.image ? (
                          <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image size={32} className="text-gray-300" />
                          </div>
                        )}
                        {!banner.isActive && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-full border">Inactive</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm text-[#232323] truncate">{banner.title}</p>
                        {banner.subtitle && <p className="text-xs text-gray-400 truncate">{banner.subtitle}</p>}
                        {banner.link && <p className="text-[10px] text-primary/70 font-mono truncate mt-0.5">{banner.link}</p>}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[9px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            #{banner.sortOrder}
                          </span>
                          <div className="ml-auto flex items-center gap-1.5">
                            <button onClick={() => toggle.mutate(banner)} title={banner.isActive ? "Deactivate" : "Activate"}
                              className="p-1.5 text-gray-400 hover:text-primary transition-colors">
                              {banner.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button onClick={() => openEdit(banner)} className="p-1.5 text-gray-400 hover:text-primary transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => { if (confirm("Delete this banner?")) del.mutate(banner.id); }} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-[#232323]">{editing ? "Edit Banner" : "New Banner"}</h3>
              <button onClick={closeForm}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map(p => (
                    <button key={p.value} type="button" onClick={() => setForm(f => ({ ...f, position: p.value }))}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${form.position === p.value ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      <p className="font-semibold">{p.label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <ImageUploadField
                label="Banner Image"
                value={form.image}
                onChange={(url) => setForm(f => ({ ...f, image: url }))}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. New Summer Collection" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Subtitle</label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. Up to 40% off" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Button Text</label>
                  <input value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Shop Now" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Link URL</label>
                <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="/shop or /collections/summer" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-[#232323]">Active (visible on storefront)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={save.isPending}
                  className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {save.isPending ? "Saving..." : editing ? "Update Banner" : "Create Banner"}
                </button>
                <button type="button" onClick={closeForm} className="px-4 py-2.5 border border-gray-200 text-sm hover:border-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
