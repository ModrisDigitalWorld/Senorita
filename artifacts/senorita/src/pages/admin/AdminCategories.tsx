import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, X, FolderOpen, Package, Search,
  CheckSquare, Square, GripVertical, Star, ChevronLeft, Sparkles, Loader2,
} from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { api, type ApiCategory, type ApiProduct, formatPrice } from "@/lib/api";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ImageGallery } from "@/components/admin/ImageGallery";
import { VariantManager, variantsFromApi, type VariantEntry } from "@/components/admin/VariantManager";
import { cn } from "@/lib/utils";

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type CatForm = {
  name: string; slug: string; image: string; description: string;
  order: string; slugEdited: boolean; similarProductIds: string[];
};
const emptyCatForm: CatForm = {
  name: "", slug: "", image: "", description: "", order: "", slugEdited: false,
  similarProductIds: [],
};

type ProdForm = {
  name: string; slug: string; price: string; salePrice: string;
  stock: string; description: string; badge: string;
  isFeatured: boolean; isActive: boolean; images: string[];
  tags: string; slugEdited: boolean;
};
const emptyProdForm: ProdForm = {
  name: "", slug: "", price: "", salePrice: "", stock: "",
  description: "", badge: "", isFeatured: false, isActive: true,
  images: [], tags: "", slugEdited: false,
};

export default function AdminCategories() {
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<ApiCategory | null>(null);
  const [catForm, setCatForm] = useState<CatForm>(emptyCatForm);
  const [simSearch, setSimSearch] = useState("");
  const [showSimPicker, setShowSimPicker] = useState(false);

  const [managingCat, setManagingCat] = useState<ApiCategory | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const [showProdForm, setShowProdForm] = useState(false);
  const [editingProd, setEditingProd] = useState<ApiProduct | null>(null);
  const [prodForm, setProdForm] = useState<ProdForm>(emptyProdForm);
  const [variants, setVariants] = useState<VariantEntry[]>([]);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const qc = useQueryClient();
  const dragIdx = useRef<number | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<ApiCategory[]>("/categories"),
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery<ApiProduct[]>({
    queryKey: ["admin-products-all"],
    queryFn: () => api.get<ApiProduct[]>("/admin/products"),
  });

  const saveCat = useMutation({
    mutationFn: (data: any) => editingCat
      ? api.put(`/categories/${editingCat.id}`, data)
      : api.post("/categories", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      closeCatForm();
    },
  });

  const delCat = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const saveProd = useMutation({
    mutationFn: (data: any) => editingProd
      ? api.put(`/products/${editingProd.id}`, data)
      : api.post("/products", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products-all"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      closeProdForm();
    },
  });

  const delProd = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products-all"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const removeProduct = useMutation({
    mutationFn: (productId: string) => api.put(`/products/${productId}`, { categoryId: null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products-all"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const openEditCat = (c: ApiCategory) => {
    setEditingCat(c);
    setCatForm({
      name: c.name, slug: c.slug, image: c.image || "",
      description: c.description || "", order: String(c.order),
      slugEdited: true, similarProductIds: c.similarProductIds ?? [],
    });
    setSimSearch(""); setShowSimPicker(false); setShowCatForm(true);
  };

  const closeCatForm = () => {
    setShowCatForm(false); setEditingCat(null);
    setCatForm(emptyCatForm); setSimSearch(""); setShowSimPicker(false);
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCat.mutate({
      name: catForm.name,
      slug: catForm.slug || toSlug(catForm.name),
      image: catForm.image || null,
      description: catForm.description || null,
      order: parseInt(catForm.order || "0"),
      similarProductIds: catForm.similarProductIds,
    });
  };

  const openNewProduct = () => {
    setEditingProd(null);
    setProdForm(emptyProdForm);
    setVariants([]);
    setShowProdForm(true);
  };

  const openEditProduct = async (p: ApiProduct) => {
    setEditingProd(p);
    setProdForm({
      name: p.name, slug: p.slug, price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : "",
      stock: String(p.stock), description: p.description || "",
      badge: p.badge || "", isFeatured: p.isFeatured, isActive: p.isActive,
      images: p.images || [], tags: (p.tags || []).join(", "), slugEdited: true,
    });
    try {
      const full = await api.get("/products/" + p.slug);
      setVariants(variantsFromApi((full as any).variants));
    } catch { setVariants(variantsFromApi(p.variants)); }
    setShowProdForm(true);
  };

  const closeProdForm = () => {
    setShowProdForm(false); setEditingProd(null); setProdForm(emptyProdForm); setVariants([]);
  };

  const handleProdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProd.mutate({
      name: prodForm.name,
      slug: prodForm.slug || toSlug(prodForm.name),
      price: parseInt(prodForm.price),
      salePrice: prodForm.salePrice ? parseInt(prodForm.salePrice) : null,
      stock: parseInt(prodForm.stock),
      description: prodForm.description,
      badge: prodForm.badge || null,
      isFeatured: prodForm.isFeatured,
      isActive: prodForm.isActive,
      categoryId: managingCat?.id || null,
      images: prodForm.images,
      tags: prodForm.tags.split(",").map(s => s.trim()).filter(Boolean),
      variants: variants.map(v => ({ type: v.type, value: v.value, stock: parseInt(v.stock) || 0, hex: v.hex })),
    });
  };

  const generateDescription = async () => {
    if (!prodForm.name) return;
    setGeneratingDesc(true);
    try {
      const res = await api.post<{ description: string }>("/ai/generate-description", {
        name: prodForm.name, images: prodForm.images,
        category: managingCat?.name, price: prodForm.price,
        tags: prodForm.tags.split(",").map(s => s.trim()).filter(Boolean),
      });
      setProdForm(f => ({ ...f, description: res.description }));
    } catch { /* silent */ } finally { setGeneratingDesc(false); }
  };

  const simPickerProducts = useMemo(() => {
    const q = simSearch.toLowerCase();
    return allProducts.filter(p =>
      !catForm.similarProductIds.includes(p.id) &&
      (!q || p.name.toLowerCase().includes(q))
    );
  }, [allProducts, catForm.similarProductIds, simSearch]);

  const selectedSimProducts = useMemo(() =>
    catForm.similarProductIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as ApiProduct[],
    [catForm.similarProductIds, allProducts]
  );

  const addToSimilar = (id: string) => setCatForm(f => ({ ...f, similarProductIds: [...f.similarProductIds, id] }));
  const removeFromSimilar = (id: string) => setCatForm(f => ({ ...f, similarProductIds: f.similarProductIds.filter(x => x !== id) }));
  const moveSimilar = (from: number, to: number) => setCatForm(f => {
    const arr = [...f.similarProductIds];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    return { ...f, similarProductIds: arr };
  });

  const catProducts = useMemo(
    () => allProducts.filter(p => p.categoryId === managingCat?.id),
    [allProducts, managingCat]
  );
  const otherProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return allProducts
      .filter(p => p.categoryId !== managingCat?.id)
      .filter(p => !q || p.name.toLowerCase().includes(q));
  }, [allProducts, managingCat, productSearch]);
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProducts.forEach(p => { if (p.categoryId) map[p.categoryId] = (map[p.categoryId] || 0) + 1; });
    return map;
  }, [allProducts]);

  const handleManage = (cat: ApiCategory) => {
    setManagingCat(cat); setProductSearch(""); setSelected(new Set()); setShowProdForm(false);
  };
  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const visibleIds = useMemo(() => otherProducts.map(p => p.id), [otherProducts]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) setSelected(prev => { const n = new Set(prev); visibleIds.forEach(id => n.delete(id)); return n; });
    else setSelected(prev => { const n = new Set(prev); visibleIds.forEach(id => n.add(id)); return n; });
  };
  const handleBulkAdd = async () => {
    if (!managingCat || selected.size === 0) return;
    setBulkSaving(true);
    try {
      await api.post("/admin/products/bulk-category", { productIds: [...selected], categoryId: managingCat.id });
      await qc.invalidateQueries({ queryKey: ["admin-products-all"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      setSelected(new Set());
    } finally { setBulkSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#232323]">Categories ({categories.length})</h1>
        <button
          onClick={() => { setEditingCat(null); setCatForm(emptyCatForm); setShowCatForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 h-32 animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No categories yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex">
              {cat.image ? (
                <div className="w-24 flex-shrink-0">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" style={{ maxHeight: "96px" }} />
                </div>
              ) : (
                <div className="w-24 flex-shrink-0 bg-gray-50 flex items-center justify-center" style={{ maxHeight: "96px", minHeight: "96px" }}>
                  <FolderOpen size={20} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 p-4">
                <p className="font-semibold text-[#232323]">{cat.name}</p>
                <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                {cat.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{cat.description}</p>}
                <div className="flex flex-wrap gap-2 mt-3 items-center">
                  <button onClick={() => handleManage(cat)}
                    className="flex items-center gap-1 text-xs text-primary font-semibold border border-primary/30 px-2 py-1 hover:bg-primary/5 transition-colors">
                    <Package size={11} />
                    Articles
                    <span className="bg-primary/10 text-primary rounded-full px-1.5 text-[10px] font-bold ml-0.5">
                      {productCountMap[cat.id] ?? 0}
                    </span>
                  </button>
                  {(cat.similarProductIds?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">
                      <Star size={9} fill="currentColor" /> {cat.similarProductIds!.length} similar
                    </span>
                  )}
                  <button onClick={() => openEditCat(cat)} className="p-1.5 text-gray-400 hover:text-primary transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => { if (confirm("Delete this category?")) delCat.mutate(cat.id); }} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Category Form Drawer ── */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-[#232323]">{editingCat ? "Edit Category" : "New Category"}</h3>
              <button onClick={closeCatForm}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-5 space-y-5">
              <ImageUploadField label="Category Image" value={catForm.image} onChange={(url) => setCatForm(f => ({ ...f, image: url }))} />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Name *</label>
                <input required value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value, slug: f.slugEdited ? f.slug : toSlug(e.target.value) }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Tops"
                />
                {catForm.name && (
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    slug: <span className="text-primary">{catForm.slugEdited ? catForm.slug : toSlug(catForm.name)}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Sort Order</label>
                <input type="number" value={catForm.order} onChange={e => setCatForm(f => ({ ...f, order: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Star size={12} className="text-amber-500" fill="currentColor" /> Recommended / Similar Products
                    </label>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">Shown as "You May Also Like" on this category page.</p>
                  </div>
                  {catForm.similarProductIds.length > 0 && (
                    <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex-shrink-0 ml-2">
                      {catForm.similarProductIds.length}
                    </span>
                  )}
                </div>
                {selectedSimProducts.length > 0 && (
                  <div className="space-y-1.5 mb-3 mt-3">
                    {selectedSimProducts.map((p, idx) => (
                      <div key={p.id} draggable
                        onDragStart={() => { dragIdx.current = idx; }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => { if (dragIdx.current !== null && dragIdx.current !== idx) { moveSimilar(dragIdx.current, idx); dragIdx.current = null; } }}
                        className="flex items-center gap-2.5 p-2 rounded-lg border border-amber-100 bg-amber-50 group">
                        <GripVertical size={13} className="text-gray-300 cursor-grab flex-shrink-0" />
                        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-8 h-8 object-cover rounded flex-shrink-0" />
                          : <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center"><Package size={12} className="text-gray-300" /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#232323] truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{formatPrice(p.price)}</p>
                        </div>
                        <button type="button" onClick={() => removeFromSimilar(p.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {showSimPicker ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
                      <Search size={13} className="text-gray-400 flex-shrink-0" />
                      <input autoFocus type="text" placeholder="Search products to add..." value={simSearch}
                        onChange={e => setSimSearch(e.target.value)}
                        className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400" />
                      <button type="button" onClick={() => { setShowSimPicker(false); setSimSearch(""); }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                      {simPickerProducts.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">{simSearch ? "No matching products" : "All products already added"}</p>
                      ) : simPickerProducts.map(p => (
                        <button key={p.id} type="button" onClick={() => { addToSimilar(p.id); setSimSearch(""); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 transition-colors text-left">
                          {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-8 h-8 object-cover rounded flex-shrink-0" />
                            : <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center"><Package size={12} className="text-gray-300" /></div>}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#232323] truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{formatPrice(p.price)}</p>
                          </div>
                          <Plus size={14} className="text-primary flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowSimPicker(true)}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors rounded-lg mt-2">
                    <Plus size={13} /> Add recommended product
                  </button>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saveCat.isPending}
                  className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                  {saveCat.isPending ? "Saving..." : editingCat ? "Update Category" : "Create Category"}
                </button>
                <button type="button" onClick={closeCatForm} className="px-4 py-2.5 border border-gray-200 text-sm hover:border-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Articles Panel ── */}
      {managingCat && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-[#232323]">{managingCat.name} — Articles</h3>
                <p className="text-xs text-gray-400 mt-0.5">{catProducts.length} article{catProducts.length !== 1 ? "s" : ""} in this category</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openNewProduct}
                  className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 hover:bg-primary/90 transition-colors">
                  <Plus size={13} /> New Article
                </button>
                <button onClick={() => { setManagingCat(null); setShowProdForm(false); }}><X size={20} className="text-gray-400" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {catProducts.length > 0 && (
                <div className="px-5 pt-4 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">In this category ({catProducts.length})</p>
                  <div className="space-y-2">
                    {catProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center"><Package size={16} className="text-gray-300" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#232323] truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">
                            {formatPrice(p.price)}
                            {p.salePrice ? <span className="line-through text-gray-300 ml-1.5">{formatPrice(p.salePrice)}</span> : null}
                            <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                              {p.isActive ? "Active" : "Inactive"}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Stock: {p.stock}</p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button onClick={() => openEditProduct(p)} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="Edit product"><Pencil size={13} /></button>
                          <button onClick={() => removeProduct.mutate(p.id)} disabled={removeProduct.isPending} title="Remove from category"
                            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"><X size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-5 pt-4 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Add existing articles {otherProducts.length > 0 && <span className="normal-case text-gray-400">({otherProducts.length})</span>}
                  </p>
                  {selected.size > 0 && (
                    <button onClick={handleBulkAdd} disabled={bulkSaving}
                      className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {bulkSaving ? "Adding..." : `Add ${selected.size} selected`}
                    </button>
                  )}
                </div>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search articles..." value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setSelected(new Set()); }}
                    className="w-full border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                {productsLoading ? (
                  <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}</div>
                ) : otherProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Package size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{productSearch ? "No matching articles" : "All articles are in this category"}</p>
                  </div>
                ) : (
                  <>
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary mb-3 font-medium transition-colors">
                      {allVisibleSelected ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} />}
                      {allVisibleSelected ? "Deselect all" : `Select all ${otherProducts.length}`}
                    </button>
                    <div className="space-y-1.5">
                      {otherProducts.map(p => {
                        const isSel = selected.has(p.id);
                        return (
                          <div key={p.id} onClick={() => toggleSelect(p.id)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${isSel ? "border-primary/40 bg-primary/5" : "border-gray-100 hover:border-gray-200"}`}>
                            <div className="flex-shrink-0">
                              {isSel ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-gray-300" />}
                            </div>
                            {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-9 h-9 object-cover rounded flex-shrink-0" />
                              : <div className="w-9 h-9 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center"><Package size={13} className="text-gray-300" /></div>}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#232323] truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">
                                {formatPrice(p.price)}
                                {p.categoryId && <span className="ml-1.5 text-amber-500">· in {categories.find(c => c.id === p.categoryId)?.name ?? "other"}</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {selected.size > 0 && (
                      <div className="sticky bottom-0 pt-4 pb-1 bg-white">
                        <button onClick={handleBulkAdd} disabled={bulkSaving}
                          className="w-full bg-primary text-white py-3 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                          {bulkSaving ? "Adding..." : `Add ${selected.size} article${selected.size > 1 ? "s" : ""} to ${managingCat.name}`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── New / Edit Product Form (slides over Articles Panel) ── */}
      {managingCat && showProdForm && (
        <div className="fixed inset-0 z-[60] flex items-start justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <button onClick={closeProdForm} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1">
                <h3 className="font-semibold text-[#232323]">{editingProd ? "Edit Article" : "New Article"}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Category: <span className="text-primary font-medium">{managingCat.name}</span></p>
              </div>
              <button onClick={closeProdForm}><X size={20} className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleProdSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {/* Images */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                    Photos <span className="normal-case text-gray-400 font-normal">(first photo is the main one)</span>
                  </label>
                  <ImageGallery
                    images={prodForm.images}
                    onChange={imgs => setProdForm(f => ({ ...f, images: imgs }))}
                    maxImages={50}
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Product Name *</label>
                  <input required value={prodForm.name}
                    onChange={e => setProdForm(f => ({ ...f, name: e.target.value, slug: f.slugEdited ? f.slug : toSlug(e.target.value) }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="e.g. Floral Crop Top" />
                  {prodForm.name && (
                    <p className="text-[10px] text-gray-400 mt-1 font-mono">
                      slug: <span className="text-primary">{prodForm.slugEdited ? prodForm.slug : toSlug(prodForm.name)}</span>
                    </p>
                  )}
                </div>

                {/* Price row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">MRP (₹) *</label>
                    <input required type="number" min="0" value={prodForm.price}
                      onChange={e => setProdForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      placeholder="1299" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Sale Price (₹)</label>
                    <input type="number" min="0" value={prodForm.salePrice}
                      onChange={e => setProdForm(f => ({ ...f, salePrice: e.target.value }))}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      placeholder="999" />
                  </div>
                </div>

                {/* Stock + Badge */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Stock *</label>
                    <input required type="number" min="0" value={prodForm.stock}
                      onChange={e => setProdForm(f => ({ ...f, stock: e.target.value }))}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      placeholder="50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Badge</label>
                    <input value={prodForm.badge}
                      onChange={e => setProdForm(f => ({ ...f, badge: e.target.value }))}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      placeholder="New, Hot, Sale…" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider">Description</label>
                    <button type="button" onClick={generateDescription} disabled={generatingDesc}
                      className="flex items-center gap-1 text-[10px] text-primary font-semibold disabled:opacity-40 hover:underline">
                      {generatingDesc ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      {generatingDesc ? "Generating…" : "AI generate"}
                    </button>
                  </div>
                  <textarea value={prodForm.description}
                    onChange={e => setProdForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Describe the product…"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Tags <span className="normal-case text-gray-400 font-normal">(comma separated)</span></label>
                  <input value={prodForm.tags}
                    onChange={e => setProdForm(f => ({ ...f, tags: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="casual, summer, cotton…" />
                </div>

                {/* Variants */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2">Sizes &amp; Colours</label>
                  <VariantManager variants={variants} onChange={setVariants} mainStock={prodForm.stock} />
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                  {[{ k: "isFeatured" as const, label: "Featured" }, { k: "isActive" as const, label: "Active" }].map(({ k, label }) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={prodForm[k]}
                        onChange={e => setProdForm(f => ({ ...f, [k]: e.target.checked }))}
                        className="accent-primary w-4 h-4" />
                      <span className="text-sm text-gray-600">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white flex gap-3">
                <button type="submit" disabled={saveProd.isPending}
                  className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                  {saveProd.isPending ? "Saving..." : editingProd ? "Update Article" : `Add to ${managingCat.name}`}
                </button>
                {editingProd && (
                  <button type="button"
                    onClick={() => { if (confirm("Delete this product?")) { delProd.mutate(editingProd.id); closeProdForm(); } }}
                    className="px-3 py-2.5 border border-red-200 text-red-400 text-sm hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
                <button type="button" onClick={closeProdForm} className="px-4 py-2.5 border border-gray-200 text-sm hover:border-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
