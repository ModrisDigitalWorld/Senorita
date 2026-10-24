import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Plus, Trash2, GripVertical, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

type VariantOption = { id: string; type: string; value: string; hex: string | null; sortOrder: number };

const PRESET_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1A237E" },
  { name: "Red", hex: "#D32F2F" },
  { name: "Pink", hex: "#E91E8C" },
  { name: "Maroon", hex: "#7B1C2C" },
  { name: "Beige", hex: "#D4B896" },
  { name: "Cream", hex: "#FFF8E7" },
  { name: "Yellow", hex: "#FDD835" },
  { name: "Mustard", hex: "#C79400" },
  { name: "Green", hex: "#388E3C" },
  { name: "Olive", hex: "#808000" },
  { name: "Teal", hex: "#00695C" },
  { name: "Blue", hex: "#1565C0" },
  { name: "Sky Blue", hex: "#039BE5" },
  { name: "Purple", hex: "#7B1FA2" },
  { name: "Lavender", hex: "#B39DDB" },
  { name: "Orange", hex: "#E64A19" },
  { name: "Peach", hex: "#FFAB76" },
  { name: "Brown", hex: "#5D4037" },
  { name: "Tan", hex: "#C5A882" },
  { name: "Grey", hex: "#757575" },
  { name: "Silver", hex: "#BDBDBD" },
  { name: "Gold", hex: "#C8A951" },
];

function isDark(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function useFetchOptions(type: "size" | "color") {
  const { token } = useAuthStore();
  return useQuery<VariantOption[]>({
    queryKey: ["variant-options", type],
    queryFn: async () => {
      const r = await fetch(`${API}/variant-options?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
  });
}

export default function AdminSizesColors() {
  const [tab, setTab] = useState<"size" | "color">("size");
  const qc = useQueryClient();
  const { token } = useAuthStore();
  const { toast } = useToast();

  const sizesQ = useFetchOptions("size");
  const colorsQ = useFetchOptions("color");

  const active = tab === "size" ? sizesQ : colorsQ;
  const items: VariantOption[] = active.data ?? [];

  async function apiFetch(path: string, method: string, body?: object) {
    const r = await fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || "Request failed");
    }
    return r.json();
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["variant-options", "size"] });
    qc.invalidateQueries({ queryKey: ["variant-options", "color"] });
  };

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/variant-options/${id}`, "DELETE"),
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#232323]">Sizes &amp; Colours</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the global list of sizes and colours available when creating products.
          </p>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          {(["size", "color"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px",
                tab === t ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-[#232323]"
              )}>
              {t === "size" ? `Sizes (${sizesQ.data?.length ?? 0})` : `Colours (${colorsQ.data?.length ?? 0})`}
            </button>
          ))}
        </div>

        {tab === "size" && (
          <SizesPanel items={items} onDelete={id => deleteMut.mutate(id)} onAdd={invalidate} token={token!} toast={toast} />
        )}
        {tab === "color" && (
          <ColorsPanel items={items} onDelete={id => deleteMut.mutate(id)} onAdd={invalidate} token={token!} toast={toast} />
        )}
      </div>
    </AdminLayout>
  );
}

function SizesPanel({ items, onDelete, onAdd, token, toast }: {
  items: VariantOption[];
  onDelete: (id: string) => void;
  onAdd: () => void;
  token: string;
  toast: any;
}) {
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

  async function addSize() {
    const v = newValue.trim();
    if (!v) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/variant-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "size", value: v, sortOrder: items.length }),
      });
      setNewValue("");
      onAdd();
      toast({ title: `Size "${v}" added` });
    } catch {
      toast({ title: "Failed to add size", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    const v = editValue.trim();
    if (!v) return;
    try {
      await fetch(`${API_BASE}/variant-options/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: v }),
      });
      setEditId(null);
      onAdd();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addSize()}
          placeholder="e.g. XS, S, M, 36, Free Size…"
          className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <button onClick={addSize} disabled={saving || !newValue.trim()}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 text-sm font-semibold rounded hover:bg-primary/90 disabled:opacity-50">
          <Plus size={15} /> Add Size
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded">
          No sizes yet. Add your first size above.
        </div>
      ) : (
        <div className="border border-gray-100 rounded divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50">
              <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
              {editId === item.id ? (
                <>
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditId(null); }}
                    autoFocus
                    className="flex-1 border border-primary rounded px-2 py-1 text-sm focus:outline-none"
                  />
                  <button onClick={() => saveEdit(item.id)} className="text-green-500 hover:text-green-700"><Check size={15} /></button>
                  <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-[#232323]">{item.value}</span>
                  <button onClick={() => { setEditId(item.id); setEditValue(item.value); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary transition-opacity">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => onDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        These sizes will appear as options when adding or editing a product.
      </p>
    </div>
  );
}

function ColorsPanel({ items, onDelete, onAdd, token, toast }: {
  items: VariantOption[];
  onDelete: (id: string) => void;
  onAdd: () => void;
  token: string;
  toast: any;
}) {
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHex, setEditHex] = useState("#000000");
  const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

  const existingNames = new Set(items.map(i => i.value.toLowerCase()));

  async function addColor() {
    const v = colorName.trim();
    if (!v) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/variant-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "color", value: v, hex: colorHex, sortOrder: items.length }),
      });
      setColorName("");
      setColorHex("#000000");
      onAdd();
      toast({ title: `Colour "${v}" added` });
    } catch {
      toast({ title: "Failed to add colour", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    const v = editName.trim();
    if (!v) return;
    try {
      await fetch(`${API_BASE}/variant-options/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: v, hex: editHex }),
      });
      setEditId(null);
      onAdd();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }

  async function addPreset(p: { name: string; hex: string }) {
    if (existingNames.has(p.name.toLowerCase())) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/variant-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "color", value: p.name, hex: p.hex, sortOrder: items.length }),
      });
      onAdd();
    } catch {
      toast({ title: "Failed to add colour", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="border border-gray-100 rounded p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Add a custom colour</p>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <div
              className="w-9 h-9 rounded border border-gray-200 overflow-hidden cursor-pointer"
              style={{ backgroundColor: colorHex }}
            >
              <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
          </div>
          <input
            value={colorName}
            onChange={e => setColorName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addColor()}
            placeholder="Colour name (e.g. Rose Pink)"
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <button onClick={addColor} disabled={saving || !colorName.trim()}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 text-sm font-semibold rounded hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      <div className="border border-gray-100 rounded p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Add from presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(p => {
            const exists = existingNames.has(p.name.toLowerCase());
            return (
              <button key={p.name} onClick={() => addPreset(p)} disabled={exists || saving}
                title={exists ? "Already added" : `Add ${p.name}`}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all",
                  exists
                    ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400"
                    : "border-gray-200 hover:border-primary hover:shadow-sm cursor-pointer"
                )}>
                <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: p.hex }} />
                {p.name}
                {exists && <Check size={10} className="text-green-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded">
          No colours yet. Add from above or pick a preset.
        </div>
      ) : (
        <div className="border border-gray-100 rounded divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50">
              <div
                className="w-6 h-6 rounded-full border border-black/10 flex-shrink-0"
                style={{ backgroundColor: item.hex || "#ccc" }}
              />
              {editId === item.id ? (
                <>
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <div className="w-8 h-8 rounded border border-gray-200" style={{ backgroundColor: editHex }} />
                    <input type="color" value={editHex} onChange={e => setEditHex(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditId(null); }}
                    autoFocus
                    className="flex-1 border border-primary rounded px-2 py-1 text-sm focus:outline-none"
                  />
                  <button onClick={() => saveEdit(item.id)} className="text-green-500 hover:text-green-700"><Check size={15} /></button>
                  <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-[#232323]">{item.value}</span>
                  {item.hex && (
                    <span className="text-[10px] font-mono text-gray-400 uppercase">{item.hex}</span>
                  )}
                  <button onClick={() => { setEditId(item.id); setEditName(item.value); setEditHex(item.hex || "#000000"); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary transition-opacity">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => onDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        These colours will appear as options when adding or editing a product.
      </p>
    </div>
  );
}
