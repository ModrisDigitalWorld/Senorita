import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CheckCircle, ExternalLink, X, XCircle } from "lucide-react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export type VariantEntry = {
  type: "size" | "color";
  value: string;
  stock: string;
  hex?: string;
};

export type GlobalVariantOption = { id: string; type: string; value: string; hex: string | null };

export function variantsFromApi(apiVariants?: any[]): VariantEntry[] {
  if (!apiVariants?.length) return [];
  return apiVariants.map(v => ({
    type: v.type as "size" | "color",
    value: v.value,
    stock: String(v.stock ?? 0),
    hex: v.hex ?? undefined,
  }));
}

export function VariantManager({ variants, onChange, mainStock = "1" }: {
  variants: VariantEntry[];
  onChange: (v: VariantEntry[]) => void;
  mainStock?: string;
}) {
  const [activeTab, setActiveTab] = useState<"size" | "color">("size");
  const [customColor, setCustomColor] = useState({ name: "", hex: "#c084fc" });

  const { data: globalSizes = [] } = useQuery<GlobalVariantOption[]>({
    queryKey: ["variant-options", "size"],
    queryFn: () => api.get<GlobalVariantOption[]>("/variant-options?type=size"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: globalColors = [] } = useQuery<GlobalVariantOption[]>({
    queryKey: ["variant-options", "color"],
    queryFn: () => api.get<GlobalVariantOption[]>("/variant-options?type=color"),
    staleTime: 1000 * 60 * 5,
  });

  const hasSize  = (v: string) => variants.some(x => x.type === "size"  && x.value === v);
  const hasColor = (v: string) => variants.some(x => x.type === "color" && x.value === v);

  const toggleSize = (v: string) => {
    if (hasSize(v)) onChange(variants.filter(x => !(x.type === "size" && x.value === v)));
    else onChange([...variants, { type: "size", value: v, stock: mainStock || "1" }]);
  };

  const toggleColor = (name: string, hex: string) => {
    if (hasColor(name)) onChange(variants.filter(x => !(x.type === "color" && x.value === name)));
    else onChange([...variants, { type: "color", value: name, stock: mainStock || "1", hex }]);
  };

  const setStock = (type: "size" | "color", value: string, stock: string) =>
    onChange(variants.map(x => x.type === type && x.value === value ? { ...x, stock } : x));

  const remove = (type: "size" | "color", value: string) =>
    onChange(variants.filter(x => !(x.type === type && x.value === value)));

  const addCustomColor = () => {
    const name = customColor.name.trim();
    if (!name) return;
    if (!hasColor(name)) onChange([...variants, { type: "color", value: name, stock: "", hex: customColor.hex }]);
    setCustomColor(c => ({ ...c, name: "" }));
  };

  const sizes  = variants.filter(v => v.type === "size");
  const colors = variants.filter(v => v.type === "color");

  const isDark = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-100 bg-gray-50">
        {(["size", "color"] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              activeTab === tab
                ? "bg-white text-primary border-b-2 border-primary"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab === "size" ? `Sizes${sizes.length ? ` (${sizes.length})` : ""}` : `Colours${colors.length ? ` (${colors.length})` : ""}`}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "size" && (
          <div className="space-y-3">
            {globalSizes.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-[11px] text-gray-400">No sizes configured yet.</p>
                <Link href="/admin/sizes-colors">
                  <button type="button" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
                    <ExternalLink size={11} /> Manage Sizes &amp; Colours
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {globalSizes.map(sz => {
                  const on = hasSize(sz.value);
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => toggleSize(sz.value)}
                      className={cn(
                        "min-w-[42px] px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all",
                        on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {sz.value}
                    </button>
                  );
                })}
              </div>
            )}

            {sizes.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Stock per size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(v => {
                    const disabled = v.stock === "0" || v.stock === "";
                    return (
                      <div key={v.value} className={cn(
                        "flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 transition-all",
                        disabled ? "border-gray-200 bg-gray-50 opacity-60" : "border-primary/20 bg-primary/5"
                      )}>
                        <span className={cn("text-xs font-bold w-10 flex-shrink-0", disabled ? "text-gray-400" : "text-primary")}>{v.value}</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          value={v.stock}
                          onChange={e => setStock("size", v.value, e.target.value)}
                          className="w-14 text-xs border border-primary/20 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary bg-white text-center"
                        />
                        <button
                          type="button"
                          title={disabled ? "Enable this size" : "Disable (set to 0)"}
                          onClick={() => setStock("size", v.value, disabled ? (mainStock || "1") : "0")}
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                            disabled ? "text-gray-300 hover:text-green-500" : "text-primary/40 hover:text-red-400"
                          )}
                        >
                          {disabled ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        </button>
                        <button type="button" onClick={() => remove("size", v.value)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {globalSizes.length > 0 && sizes.length === 0 && (
              <p className="text-[11px] text-gray-400 text-center py-2">Click a size above to add it</p>
            )}
          </div>
        )}

        {activeTab === "color" && (
          <div className="space-y-3">
            {globalColors.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-[11px] text-gray-400">No colours configured yet.</p>
                <Link href="/admin/sizes-colors">
                  <button type="button" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
                    <ExternalLink size={11} /> Manage Sizes &amp; Colours
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {globalColors.map(c => {
                  const on = hasColor(c.value);
                  const hex = c.hex || "#ccc";
                  const dark = isDark(hex);
                  const isLight = ["#FFFFFF", "#FFFFF0", "#FFF8DC", "#FAF9F6", "#FFF8E7"].includes(hex.toUpperCase());
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.value, hex)}
                      title={c.value}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center",
                        on ? "border-primary scale-110 shadow-md" : "border-gray-200 hover:border-gray-400 hover:scale-105",
                        isLight ? "border-gray-300" : ""
                      )}
                      style={{ backgroundColor: hex }}
                    >
                      {on && <Check size={10} strokeWidth={3} className={dark ? "text-white" : "text-gray-800"} />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <input
                type="color"
                value={customColor.hex}
                onChange={e => setCustomColor(c => ({ ...c, hex: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                title="Pick custom colour"
              />
              <input
                type="text"
                placeholder="Custom colour name…"
                value={customColor.name}
                onChange={e => setCustomColor(c => ({ ...c, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomColor())}
                className="flex-1 text-xs border border-gray-200 px-2 py-1.5 rounded focus:outline-none focus:border-primary bg-white"
              />
              <button
                type="button"
                onClick={addCustomColor}
                disabled={!customColor.name.trim()}
                className="text-xs font-semibold px-3 py-1.5 bg-[#232323] text-white rounded hover:bg-primary transition-colors disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {colors.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Stock per colour</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map(v => {
                    const disabled = v.stock === "0" || v.stock === "";
                    return (
                      <div key={v.value} className={cn(
                        "flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 transition-all",
                        disabled ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200 bg-white"
                      )}>
                        <span className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: v.hex || "#ccc" }} />
                        <span className={cn("text-xs font-medium max-w-[70px] truncate", disabled ? "text-gray-400" : "text-gray-700")}>{v.value}</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          value={v.stock}
                          onChange={e => setStock("color", v.value, e.target.value)}
                          className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary text-center"
                        />
                        <button
                          type="button"
                          title={disabled ? "Enable this colour" : "Disable (set to 0)"}
                          onClick={() => setStock("color", v.value, disabled ? (mainStock || "1") : "0")}
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                            disabled ? "text-gray-300 hover:text-green-500" : "text-gray-300 hover:text-red-400"
                          )}
                        >
                          {disabled ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        </button>
                        <button type="button" onClick={() => remove("color", v.value)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {globalColors.length > 0 && colors.length === 0 && (
              <p className="text-[11px] text-gray-400 text-center py-2">Click a swatch above to add a colour</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
