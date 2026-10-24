import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SlidersHorizontal, ChevronDown, Search, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/product-card";
import { api, type ApiCategory } from "@/lib/api";
import { useProducts } from "@/hooks/use-products";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { label: "Newest", value: "new" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function Shop({ initialSlug }: { initialSlug?: string } = {}) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiCategory[]>("/categories"),
  });

  const initialCatId = initialSlug
    ? (categories.find(c => c.slug === initialSlug)?.id ?? "")
    : "";

  const [selectedCategory, setSelectedCategory] = useState("");
  const [sort, setSort] = useState("new");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Once categories load, pre-select the one matching the slug
  if (initialSlug && !initialized && initialCatId) {
    setSelectedCategory(initialCatId);
    setInitialized(true);
  }

  const { data: products = [], isLoading } = useProducts({
    category: selectedCategory || undefined,
    search: search || undefined,
  });

  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return 0;
  });

  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      {/* Page header */}
      <div className="bg-[#f5f5f5] py-10 px-4 text-center">
        <h1 className="font-display text-4xl md:text-5xl text-[#232323] mb-2">
          {selectedCategory
            ? (categories.find(c => c.id === selectedCategory)?.name ?? "Shop")
            : "Shop All"}
        </h1>
        <p className="text-gray-500 text-sm">{sorted.length} products</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search products..." value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
              className="w-full pl-9 pr-9 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#232323]">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowFilters(f => !f)}
              className={cn("flex items-center gap-2 px-4 py-2.5 border text-sm font-medium transition-colors",
                showFilters ? "border-primary text-primary bg-primary/5" : "border-gray-200 text-[#232323] hover:border-primary")}>
              <SlidersHorizontal size={15} /> Filters
            </button>

            <div className="relative">
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="appearance-none pl-4 pr-8 py-2.5 border border-gray-200 text-sm text-[#232323] focus:outline-none focus:border-primary bg-white cursor-pointer">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category filters */}
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-100">
            <button onClick={() => setSelectedCategory("")}
              className={cn("px-4 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors",
                !selectedCategory ? "bg-[#232323] text-white border-[#232323]" : "border-gray-200 text-[#232323] hover:border-primary hover:text-primary")}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                className={cn("px-4 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors",
                  selectedCategory === cat.id ? "bg-[#232323] text-white border-[#232323]" : "border-gray-200 text-[#232323] hover:border-primary hover:text-primary")}>
                {cat.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 mb-3" />
                <div className="h-3 bg-gray-200 mb-2 w-3/4" />
                <div className="h-3 bg-gray-200 w-1/2" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-2">No products found</p>
            <button onClick={() => { setSelectedCategory(""); setSearch(""); setSearchInput(""); }} className="text-sm text-primary underline underline-offset-2">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {sorted.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
