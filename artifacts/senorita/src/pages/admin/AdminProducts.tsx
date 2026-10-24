import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Search, Images, Sparkles, Loader2 } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { api, type ApiProduct, type ApiCategory, formatPrice } from "@/lib/api";
import { ImageGallery } from "@/components/admin/ImageGallery";
import { VariantManager, variantsFromApi, type VariantEntry } from "@/components/admin/VariantManager";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ProductForm = {
  name: string; slug: string; price: string; salePrice: string;
  stock: string; description: string; badge: string; isFeatured: boolean;
  isActive: boolean; categoryId: string; images: string[]; tags: string;
  slugEdited: boolean;
};

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const emptyForm: ProductForm = {
  name: "", slug: "", price: "", salePrice: "", stock: "",
  description: "", badge: "", isFeatured: false, isActive: true,
  categoryId: "", images: [], tags: "", slugEdited: false,
};

/* ── Main AdminProducts page ── */
export default function AdminProducts() {
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<ApiProduct | null>(null);
  const [form, setForm]               = useState<ProductForm>(emptyForm);
  const [variants, setVariants]       = useState<VariantEntry[]>([]);
  const [search, setSearch]           = useState("");
  const [imageProduct, setImageProduct] = useState<ApiProduct | null>(null);
  const [imageList, setImageList]     = useState<string[]>([]);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.get<ApiProduct[]>("/products?limit=100"),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiCategory[]>("/categories"),
  });

  const save = useMutation({
    mutationFn: (data: any) => editing
      ? api.put(`/products/${editing.id}`, data)
      : api.post("/products", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); closeForm(); },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message || "Something went wrong.", variant: "destructive" });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const saveImages = useMutation({
    mutationFn: ({ id, images }: { id: string; images: string[] }) =>
      api.put(`/products/${id}`, { images }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); setImageProduct(null); },
  });

  const openImageEdit = (p: ApiProduct) => { setImageProduct(p); setImageList(p.images || []); };

  const generateDescription = async () => {
    setGeneratingDesc(true);
    try {
      const cat = categories.find(c => c.id === form.categoryId);
      const res = await api.post<{ description: string }>("/ai/generate-description", {
        name: form.name, images: form.images, category: cat?.name,
        price: form.price, tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
      });
      setForm(f => ({ ...f, description: res.description }));
    } catch (err) { console.error("Generate failed:", err); }
    finally { setGeneratingDesc(false); }
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setVariants([]); setShowForm(true); };

  const openEdit = async (p: ApiProduct) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : "", stock: String(p.stock),
      description: p.description || "", badge: p.badge || "",
      isFeatured: p.isFeatured, isActive: p.isActive,
      categoryId: p.categoryId || "", images: p.images || [],
      tags: (p.tags || []).join(", "), slugEdited: true,
    });
    setVariants([]);
    setShowForm(true);
    try {
      const full = await api.get<ApiProduct>(`/products/${p.slug}`);
      setVariants(variantsFromApi(full.variants));
    } catch {
      setVariants(variantsFromApi(p.variants));
    }
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setVariants([]); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mainStockFallback = parseInt(form.stock) || 1;
    const variantPayload = variants
      .filter(v => v.value)
      .map(v => ({ type: v.type, value: v.value, stock: parseInt(v.stock) || mainStockFallback, priceModifier: 0 }));

    save.mutate({
      name: form.name,
      slug: form.slug || toSlug(form.name),
      price: parseInt(form.price) || 0,
      salePrice: form.salePrice ? parseInt(form.salePrice) : null,
      stock: parseInt(form.stock) || 0,
      description: form.description,
      badge: form.badge || null,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      categoryId: form.categoryId || null,
      images: form.images,
      tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
      ...(variantPayload.length > 0 ? { variants: variantPayload } : {}),
    });
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#232323]">Products ({products.length})</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 text-sm focus:outline-none focus:border-primary" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Product</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Price</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Stock</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover bg-[#f5f5f5] rounded flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-300 text-xs">No img</div>
                      )}
                      <div>
                        <p className="font-medium text-[#232323]">{p.name}</p>
                        {p.badge && <span className="text-[10px] bg-[#232323] text-white px-1.5 py-0.5">{p.badge}</span>}
                        {p.variants && p.variants.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {p.variants.filter(v => v.type === "size").slice(0, 4).map(v => (
                              <span key={v.id} className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded font-semibold">{v.value}</span>
                            ))}
                            {p.variants.filter(v => v.type === "color").slice(0, 5).map(v => (
                              <span key={v.id} className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block" title={v.value}
                                style={{ backgroundColor: COLOR_PALETTE.find(c => c.name === v.value)?.hex || "#ccc" }} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{formatPrice(p.price)}</span>
                    {p.salePrice && <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(p.salePrice)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 5 ? "text-red-500 font-semibold" : p.stock <= 15 ? "text-orange-500" : "text-green-600"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openImageEdit(p)} title="Manage Images" className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Images size={14} /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Delete this product?")) del.mutate(p.id); }} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No products found</p>}
        </div>
      </div>

      {/* ── Image Upload Drawer ── */}
      {imageProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-[#232323]">Product Images</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{imageProduct.name}</p>
              </div>
              <button onClick={() => setImageProduct(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 flex-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">
                  {imageList.length} image{imageList.length !== 1 ? "s" : ""} · First image is shown as main photo
                </p>
                {imageList.length > 0 && (
                  <button type="button" onClick={() => setImageList([])}
                    className="text-[10px] text-red-400 hover:text-red-600 font-semibold uppercase tracking-wide">
                    Clear All
                  </button>
                )}
              </div>
              <ImageGallery images={imageList} onChange={setImageList} maxImages={50} />
              <div className="mt-4 bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Tips</p>
                <p className="text-[11px] text-gray-400">• Click the + tile or drag &amp; drop to upload images</p>
                <p className="text-[11px] text-gray-400">• Use ◀ ▶ arrows (hover on image) to reorder</p>
                <p className="text-[11px] text-gray-400">• Up to 50 images per product</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white flex gap-3">
              <button onClick={() => saveImages.mutate({ id: imageProduct.id, images: imageList })}
                disabled={saveImages.isPending}
                className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saveImages.isPending ? "Saving…" : "Save Images"}
              </button>
              <button type="button" onClick={() => setImageProduct(null)}
                className="px-4 py-2.5 border border-gray-200 text-sm hover:border-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Form Drawer ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-[#232323]">{editing ? "Edit Product" : "New Product"}</h3>
              <button onClick={closeForm}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              <ImageGallery
                label="Product Images"
                images={form.images}
                onChange={(images) => setForm(f => ({ ...f, images }))}
                maxImages={50}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  type="text" required value={form.name}
                  list="product-name-suggestions"
                  onChange={e => setForm(f => ({
                    ...f, name: e.target.value,
                    slug: f.slugEdited ? f.slug : toSlug(e.target.value),
                  }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Velvet Hour Dress"
                />
                <datalist id="product-name-suggestions">
                  {products.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
                {form.name && (
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    URL: /product/<span className="text-primary">{form.slugEdited ? form.slug : toSlug(form.name)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Badge Label</label>
                <input type="text" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. New, Hot 🔥, Limited" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[{ k: "price", label: "Price (₹)" }, { k: "salePrice", label: "Sale Price" }, { k: "stock", label: "Stock" }].map(({ k, label }) => (
                  <div key={k}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</label>
                    <input type="number" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      required={k === "price" || k === "stock"}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Category</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* ── Sizes & Colours ── */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Sizes &amp; Colours</label>
                <VariantManager variants={variants} onChange={setVariants} mainStock={form.stock} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider">Description</label>
                  <button
                    type="button" onClick={generateDescription} disabled={generatingDesc}
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-primary border border-primary/40 px-2.5 py-1 rounded-full hover:bg-primary hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {generatingDesc ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {generatingDesc ? "Generating…" : "Auto-Generate"}
                  </button>
                </div>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  placeholder="Write a description or use Auto-Generate above…"
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Tags (comma separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="casual, summer, tops" />
              </div>

              <div className="flex gap-6">
                {[{ k: "isFeatured", label: "Featured" }, { k: "isActive", label: "Active" }].map(({ k, label }) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))}
                      className="w-4 h-4 accent-primary" />
                    <span className="text-sm text-[#232323]">{label}</span>
                  </label>
                ))}
              </div>

              {save.isError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {(save.error as Error)?.message || "Failed to save product. Please try again."}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={save.isPending}
                  className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {save.isPending ? "Saving..." : editing ? "Update Product" : "Create Product"}
                </button>
                <button type="button" onClick={closeForm} className="px-4 py-2.5 border border-gray-200 text-sm hover:border-gray-300 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
