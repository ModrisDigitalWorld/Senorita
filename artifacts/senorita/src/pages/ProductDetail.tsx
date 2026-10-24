import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingBag, ChevronLeft, Truck, BadgeCheck, RotateCcw, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/product-card";
import { api, type ApiProduct, type ApiReview, formatPrice } from "@/lib/api";
import { useCartStore } from "@/stores/cart";
import { useProducts } from "@/hooks/use-products";

const emptyReviewForm = { rating: 5, title: "", comment: "", reviewerName: "", reviewerEmail: "" };

function StarPicker({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i} type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star size={22} className={`transition-colors ${i <= (hovered || value) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [, setLocation] = useLocation();
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [reviewDone, setReviewDone] = useState(false);
  const addItem = useCartStore(s => s.addItem);
  const openCart = useCartStore(s => s.openCart);
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<ApiProduct & { variants: any[] }>(`/products/${slug}`),
    enabled: !!slug,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: () => api.get<ApiReview[]>(`/reviews/${product?.id}`),
    enabled: !!product?.id,
  });

  const submitReview = useMutation({
    mutationFn: (data: typeof emptyReviewForm & { productId: string }) =>
      api.post("/reviews", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", product?.id] });
      setReviewForm(emptyReviewForm);
      setReviewDone(true);
    },
  });

  const { data: related = [] } = useProducts({ category: product?.categoryId ?? undefined, limit: 4 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 w-3/4" />
              <div className="h-6 bg-gray-200 w-1/4" />
              <div className="h-24 bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-500 mb-4">Product not found</p>
          <button onClick={() => setLocation("/shop")} className="text-primary underline">Back to Shop</button>
        </div>
      </div>
    );
  }

  const sizeVariants = product.variants?.filter((v: any) => v.type === "size") ?? [];
  const displayPrice = product.salePrice ?? product.price;
  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : null;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const selectedSizeVariant = sizeVariants.find((v: any) => v.value === selectedSize);
  const selectedSizeOutOfStock = selectedSizeVariant ? selectedSizeVariant.stock === 0 : false;

  const handleAddToCart = () => {
    if (sizeVariants.length > 0 && !selectedSize) {
      alert("Please select a size");
      return;
    }
    if (selectedSizeOutOfStock) return;
    addItem({
      id: `${product.id}-${selectedSize || "default"}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0] || "",
      price: displayPrice,
      quantity: 1,
      variantLabel: selectedSize || undefined,
    });
    setAddedToCart(true);
    openCart();
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => setLocation("/shop")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors mb-6">
          <ChevronLeft size={16} /> Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
              <img src={product.images[selectedImage] || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-20 overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-start gap-2 mb-2">
              {product.badge && (
                <span className="bg-[#232323] text-white text-[10px] font-semibold uppercase px-2 py-1 leading-none">{product.badge}</span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold text-[#232323] mb-2">{product.name}</h1>

            {avgRating && (
              <div className="flex items-center gap-1.5 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={13} className={Number(i) <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />)}
                <span className="text-xs text-gray-500">{avgRating} ({reviews.length} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl font-bold text-[#232323]">{formatPrice(displayPrice)}</span>
              {product.salePrice && <span className="text-gray-400 line-through text-base">{formatPrice(product.price)}</span>}
              {discount && <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5">{discount}% OFF</span>}
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>

            {/* Size selector */}
            {sizeVariants.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Size</span>
                  <button className="text-xs text-primary underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizeVariants.map((v: any) => {
                    const outOfStock = v.stock === 0;
                    return (
                      <button key={v.id} onClick={() => !outOfStock && setSelectedSize(v.value)} disabled={outOfStock}
                        className={`px-3.5 py-2 text-sm border font-medium transition-colors disabled:opacity-40 disabled:line-through disabled:cursor-not-allowed ${selectedSize === v.value ? "bg-[#232323] text-white border-[#232323]" : outOfStock ? "border-gray-100 text-gray-300 bg-gray-50" : "border-gray-200 text-[#232323] hover:border-primary hover:text-primary"}`}>
                        {v.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <button onClick={handleAddToCart} disabled={product.stock === 0 || selectedSizeOutOfStock}
                className={`flex-1 py-4 text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${addedToCart ? "bg-green-600 text-white" : "bg-[#232323] hover:bg-primary text-white"}`}>
                {product.stock === 0 || selectedSizeOutOfStock ? "Out of Stock" : addedToCart ? "Added to Cart ✓" : <><ShoppingBag size={16} /> Add to Cart</>}
              </button>
              <button className="w-12 h-12 mt-0.5 border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-colors flex-shrink-0">
                <Heart size={18} />
              </button>
            </div>

            <div className="space-y-3 py-4 border-t border-b border-gray-100 mb-6">
              {[
                { icon: Truck, text: "Free shipping on orders over ₹999" },
                { icon: BadgeCheck, text: "100% authentic products" },
                { icon: RotateCcw, text: "Easy 7-day returns" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
                  <Icon size={16} className="text-primary flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-400">
              <span>SKU: {product.id.slice(0, 8).toUpperCase()}</span>
              <span className="mx-2">·</span>
              <span>Stock: {product.stock > 0 ? `${product.stock} available` : "Out of stock"}</span>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <h2 className="text-xl font-semibold mb-6">
            Customer Reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}
          </h2>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {reviews.map(review => (
                <div key={review.id} className="bg-[#f9f9f9] p-5">
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />)}
                  </div>
                  {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">— {review.userName}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-10">No reviews yet. Be the first to share your experience!</p>
          )}

          {/* Write a review */}
          <div className="border-t border-gray-100 pt-10">
            <h3 className="text-lg font-semibold mb-5">Write a Review</h3>
            {reviewDone ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <p className="text-green-700 font-semibold mb-1">Thank you for your review!</p>
                <p className="text-green-600 text-sm">It will appear after approval by our team.</p>
                <button onClick={() => setReviewDone(false)} className="mt-3 text-sm text-primary underline">Write another review</button>
              </div>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!product) return;
                  submitReview.mutate({ ...reviewForm, productId: product.id });
                }}
                className="max-w-lg space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2">Your Rating *</label>
                  <StarPicker value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Your Name *</label>
                    <input
                      required value={reviewForm.reviewerName}
                      onChange={e => setReviewForm(f => ({ ...f, reviewerName: e.target.value }))}
                      placeholder="e.g. Priya S."
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Email (optional)</label>
                    <input
                      type="email" value={reviewForm.reviewerEmail}
                      onChange={e => setReviewForm(f => ({ ...f, reviewerEmail: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Title (optional)</label>
                  <input
                    value={reviewForm.title}
                    onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Beautiful dress!"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Your Review *</label>
                  <textarea
                    required value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    rows={4}
                    placeholder="Tell others what you think about this product…"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>
                {submitReview.isError && (
                  <p className="text-red-500 text-sm">{(submitReview.error as Error)?.message || "Failed to submit. Please try again."}</p>
                )}
                <button
                  type="submit"
                  disabled={submitReview.isPending}
                  className="bg-[#232323] text-white px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitReview.isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Review"}
                </button>
                <p className="text-xs text-gray-400">Reviews are moderated and will appear after approval.</p>
              </form>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.filter(p => p.id !== product.id).length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.filter(p => p.id !== product.id).slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
