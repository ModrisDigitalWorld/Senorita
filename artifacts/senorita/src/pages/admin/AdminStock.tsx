import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { api, type ApiProduct, type ApiVariant } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Save, CheckCircle, XCircle, Package } from "lucide-react";

type ProductWithVariants = ApiProduct & { isActive: boolean; variants: ApiVariant[] };

type StockEdit = {
  mainStock: number;
  variants: Record<string, number>;
};

type GlobalVariantOption = { id: string; type: string; value: string; hex: string | null };

export default function AdminStock() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, StockEdit>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const { data: products = [], isLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["admin-stock"],
    queryFn: () => api.get<ProductWithVariants[]>("/admin/stock"),
  });

  const { data: globalColors = [] } = useQuery<GlobalVariantOption[]>({
    queryKey: ["variant-options", "color"],
    queryFn: () => api.get<GlobalVariantOption[]>("/variant-options?type=color"),
    staleTime: 1000 * 60 * 5,
  });

  const colorHex = (name: string) =>
    globalColors.find(c => c.value === name)?.hex || "#ccc";

  const filtered = products.filter(p => {
    const mainStk = getMainStock(p);
    const varStocks = p.variants.map(v => getVariantStock(p, v.id, v.stock));
    if (filter === "out") return mainStk === 0 || varStocks.some(s => s === 0);
    if (filter === "low") return (mainStk > 0 && mainStk <= 5) || varStocks.some(s => s > 0 && s <= 5);
    return true;
  });

  function getMainStock(p: ProductWithVariants) {
    return edits[p.id]?.mainStock ?? p.stock;
  }

  function getVariantStock(p: ProductWithVariants, variantId: string, def: number) {
    return edits[p.id]?.variants[variantId] ?? def;
  }

  function setMainStock(productId: string, stock: number) {
    setEdits(prev => ({
      ...prev,
      [productId]: { mainStock: stock, variants: prev[productId]?.variants ?? {} },
    }));
  }

  function setVariantStock(productId: string, variantId: string, stock: number) {
    const product = products.find(p => p.id === productId);
    setEdits(prev => ({
      ...prev,
      [productId]: {
        mainStock: prev[productId]?.mainStock ?? product?.stock ?? 0,
        variants: { ...(prev[productId]?.variants ?? {}), [variantId]: stock },
      },
    }));
  }

  function toggleVariant(p: ProductWithVariants, variantId: string, currentStock: number) {
    const restoreStock = getMainStock(p) || 1;
    setVariantStock(p.id, variantId, currentStock === 0 ? restoreStock : 0);
  }

  async function save(p: ProductWithVariants) {
    const edit = edits[p.id];
    if (!edit) return;
    setSaving(prev => new Set(prev).add(p.id));
    try {
      const variantUpdates = Object.entries(edit.variants).map(([id, stock]) => ({ id, stock }));
      await api.patch(`/products/${p.id}/stock`, { stock: edit.mainStock, variants: variantUpdates });
      setEdits(prev => { const n = { ...prev }; delete n[p.id]; return n; });
      qc.invalidateQueries({ queryKey: ["admin-stock"] });
      toast({ title: "Saved", description: `${p.name} stock updated.` });
    } catch {
      toast({ title: "Save failed", description: "Could not update stock.", variant: "destructive" });
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(p.id); return n; });
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function stockBadge(stock: number) {
    if (stock === 0) return { label: "Out", cls: "bg-red-100 text-red-600" };
    if (stock <= 5) return { label: "Low", cls: "bg-orange-100 text-orange-600" };
    return { label: "OK", cls: "bg-green-100 text-green-700" };
  }

  const counts = {
    all: products.length,
    low: products.filter(p => {
      const s = p.stock; const vs = p.variants.map(v => v.stock);
      return (s > 0 && s <= 5) || vs.some(x => x > 0 && x <= 5);
    }).length,
    out: products.filter(p => p.stock === 0 || p.variants.some(v => v.stock === 0)).length,
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#232323]">Stock Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Update stock levels per product, size, and colour</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "low", "out"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
                filter === f ? "bg-white text-[#232323] shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f === "all" ? "All" : f === "low" ? "⚠️ Low Stock" : "❌ Out of Stock"}
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                filter === f ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"
              )}>{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[68px] bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Package size={36} strokeWidth={1.2} />
          <p className="text-sm">No products found for this filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const isExp = expanded.has(p.id);
            const dirty = !!edits[p.id];
            const isSaving = saving.has(p.id);
            const mainStock = getMainStock(p);
            const { label: mLabel, cls: mCls } = stockBadge(mainStock);
            const sizes = p.variants.filter(v => v.type === "size");
            const colors = p.variants.filter(v => v.type === "color");
            const hasVariants = sizes.length > 0 || colors.length > 0;

            return (
              <div
                key={p.id}
                className={cn(
                  "bg-white rounded-xl border transition-all",
                  dirty ? "border-primary/40 shadow-sm" : "border-gray-100"
                )}
              >
                {/* Product header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-11 h-11 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                  ) : (
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300">
                      <Package size={18} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#232323] text-sm truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {!hasVariants && "No size/colour variants"}
                      {sizes.length > 0 && `${sizes.length} size${sizes.length > 1 ? "s" : ""}`}
                      {sizes.length > 0 && colors.length > 0 && " · "}
                      {colors.length > 0 && `${colors.length} colour${colors.length > 1 ? "s" : ""}`}
                    </p>
                  </div>

                  {/* Main stock editor */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", mCls)}>{mLabel}</span>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-[10px] text-gray-400 font-medium">Total:</span>
                      <input
                        type="number"
                        min="0"
                        value={mainStock}
                        onChange={e => setMainStock(p.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center text-sm font-bold border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {dirty && (
                      <button
                        onClick={() => save(p)}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                      >
                        <Save size={11} /> {isSaving ? "Saving…" : "Save"}
                      </button>
                    )}
                    {hasVariants && (
                      <button
                        onClick={() => toggleExpand(p.id)}
                        className="p-1.5 text-gray-400 hover:text-[#232323] transition-colors rounded-lg hover:bg-gray-50"
                      >
                        {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded variant rows */}
                {isExp && hasVariants && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-4">
                    {/* Sizes */}
                    {sizes.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Sizes</p>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map(v => {
                            const stock = getVariantStock(p, v.id, v.stock);
                            const { label, cls } = stockBadge(stock);
                            const disabled = stock === 0;
                            return (
                              <div
                                key={v.id}
                                className={cn(
                                  "flex items-center gap-2 border rounded-lg px-2.5 py-2 transition-all",
                                  disabled
                                    ? "border-gray-200 bg-gray-50 opacity-60"
                                    : "border-primary/20 bg-primary/5"
                                )}
                              >
                                <span className={cn(
                                  "text-xs font-bold w-9 text-center",
                                  disabled ? "text-gray-400" : "text-primary"
                                )}>{v.value}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={stock}
                                  onChange={e => setVariantStock(p.id, v.id, parseInt(e.target.value) || 0)}
                                  className="w-16 text-xs border border-gray-200 rounded px-1.5 py-1.5 focus:outline-none focus:border-primary text-center bg-white font-medium"
                                />
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", cls)}>{label}</span>
                                <button
                                  type="button"
                                  title={disabled ? "Enable this size" : "Disable (set to 0)"}
                                  onClick={() => toggleVariant(p, v.id, stock)}
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                    disabled
                                      ? "bg-gray-200 hover:bg-green-100 text-gray-400 hover:text-green-600"
                                      : "bg-primary/10 hover:bg-red-100 text-primary hover:text-red-500"
                                  )}
                                >
                                  {disabled
                                    ? <CheckCircle size={13} />
                                    : <XCircle size={13} />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Colours */}
                    {colors.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Colours</p>
                        <div className="flex flex-wrap gap-2">
                          {colors.map(v => {
                            const stock = getVariantStock(p, v.id, v.stock);
                            const { label, cls } = stockBadge(stock);
                            const disabled = stock === 0;
                            return (
                              <div
                                key={v.id}
                                className={cn(
                                  "flex items-center gap-2 border rounded-lg px-2.5 py-2 transition-all",
                                  disabled ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200 bg-white"
                                )}
                              >
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                                  style={{ backgroundColor: colorHex(v.value) }}
                                />
                                <span className={cn(
                                  "text-xs font-medium max-w-[64px] truncate",
                                  disabled ? "text-gray-400" : "text-gray-700"
                                )}>{v.value}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={stock}
                                  onChange={e => setVariantStock(p.id, v.id, parseInt(e.target.value) || 0)}
                                  className="w-16 text-xs border border-gray-200 rounded px-1.5 py-1.5 focus:outline-none focus:border-primary text-center font-medium"
                                />
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", cls)}>{label}</span>
                                <button
                                  type="button"
                                  title={disabled ? "Enable this colour" : "Disable (set to 0)"}
                                  onClick={() => toggleVariant(p, v.id, stock)}
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                    disabled
                                      ? "bg-gray-200 hover:bg-green-100 text-gray-400 hover:text-green-600"
                                      : "bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500"
                                  )}
                                >
                                  {disabled
                                    ? <CheckCircle size={13} />
                                    : <XCircle size={13} />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
