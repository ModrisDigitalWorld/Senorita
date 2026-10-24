import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, X, ShoppingBag } from "lucide-react";
import { type Product } from "@/hooks/use-products";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [wished, setWished] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore(s => s.addItem);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleSizeSelect = (size: string) => {
    addItem({
      id: `${product.id}-${size}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.image,
      price: product.price,
      quantity: 1,
      variantLabel: size,
    });
    setSizeOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group flex flex-col"
    >
      <div className="relative overflow-hidden bg-[#f5f5f5] mb-3">
        <button
          onClick={() => setWished(w => !w)}
          aria-label="Add to wishlist"
          className="absolute top-2.5 left-2.5 z-20 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Heart size={15} className={cn("transition-colors", wished ? "fill-primary text-primary" : "text-[#232323]")} />
        </button>

        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-1">
          {discount && (
            <span className="bg-primary text-white text-[10px] font-semibold uppercase px-2 py-0.5 leading-none">
              -{discount}%
            </span>
          )}
          {product.badge && (
            <span className="bg-[#232323] text-white text-[10px] font-semibold uppercase px-2 py-0.5 leading-none">
              {product.badge}
            </span>
          )}
        </div>

        <Link href={`/product/${product.slug}`}>
          <div className="aspect-[3/4] overflow-hidden">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
          </div>
        </Link>

        <AnimatePresence>
          {sizeOpen && (
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0 bg-white z-30 px-3 pt-3 pb-2 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]">Select Size</span>
                <button onClick={() => setSizeOpen(false)} className="text-gray-400 hover:text-[#232323]"><X size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SIZES.map(s => (
                  <button key={s} onClick={() => handleSizeSelect(s)}
                    className="text-[11px] px-2.5 py-1 border border-gray-300 text-[#232323] hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors font-medium">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!sizeOpen && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
            <button onClick={() => setSizeOpen(true)}
              className={cn("w-full py-3 text-[11px] font-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200",
                added ? "bg-primary text-white" : "bg-white text-[#232323] hover:bg-[#232323] hover:text-white")}>
              {added ? "Added ✓" : <><ShoppingBag size={13} /> Quick Add</>}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(i => <Star key={i} size={11} className={i <= 4 ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />)}
          <span className="text-[10px] text-gray-400 ml-1">(24)</span>
        </div>
        <Link href={`/product/${product.slug}`} className="font-serif text-[#232323] hover:text-primary text-sm font-medium leading-snug transition-colors line-clamp-2">
          {product.name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[#232323] font-semibold text-sm">₹{product.price.toLocaleString("en-IN")}</span>
          {product.originalPrice && <span className="text-gray-400 line-through text-xs">₹{product.originalPrice.toLocaleString("en-IN")}</span>}
        </div>
      </div>
    </motion.div>
  );
}
