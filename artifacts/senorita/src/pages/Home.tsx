import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, BadgeCheck, Truck, Wallet, Tag, Star, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/product-card";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";

const TRUST_BADGES = [
  { icon: BadgeCheck, label: "Assured Quality", sub: "100% checked & verified" },
  { icon: Truck,      label: "Fast Delivery",   sub: "Ships within 2–4 days" },
  { icon: Wallet,     label: "Secure Payments",  sub: "UPI, cards & more" },
  { icon: Tag,        label: "Affordable Prices", sub: "Fashion that fits your budget" },
];


const REVIEWS = [
  {
    name: "Priya S.",
    location: "Mumbai",
    rating: 5,
    text: "Absolutely loved my Co-ord set! The fabric quality is amazing and the fit was perfect. Got so many compliments. Will definitely order again!",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=80&auto=format&fit=crop",
    product: "Floral Co-ord Set",
  },
  {
    name: "Ananya R.",
    location: "Bengaluru",
    rating: 5,
    text: "Senorita's dresses are stunning! Ordered for my birthday and it arrived in just 2 days. The packaging was so pretty too — felt like a gift.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=80&auto=format&fit=crop",
    product: "Ruffle Midi Dress",
  },
  {
    name: "Divya M.",
    location: "Delhi",
    rating: 5,
    text: "Finally a brand that makes stylish clothes at affordable prices! The tops section is my favourite. Every piece looks even better in person.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80&auto=format&fit=crop",
    product: "Puff Sleeve Crop Top",
  },
  {
    name: "Kavya T.",
    location: "Hyderabad",
    rating: 4,
    text: "Super cute collection and great value for money. Ordering was so easy and the payment process was smooth. Slight delay in shipping but the quality made up for it!",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=80&auto=format&fit=crop",
    product: "Satin Slip Dress",
  },
];

const MARQUEE_ITEMS = [
  "New Arrivals Every Friday",
  "✦",
  "Bold Styles Made for You",
  "✦",
  "Free Shipping Over ₹999",
  "✦",
  "Secure Online Payments",
  "✦",
  "Exclusive Drops · Limited Stock",
  "✦",
  "Shop the New Collection 2026",
  "✦",
];

/* ── Animated picture card for New Arrivals ─────────────────────────── */
function NewArrivalPicture({ product, index }: { product: any; index: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-80, 80], [8, -8]);
  const rotateY = useTransform(x, [-80, 80], [-8, 8]);

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const resetMouse = () => { x.set(0); y.set(0); };

  const isFloat = index % 3 === 0;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50, scale: 0.92 },
        show:   { opacity: 1, y: 0,  scale: 1 },
      }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      animate={isFloat ? {
        y: [0, -8, 0],
        transition: { duration: 3.5 + index * 0.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 },
      } : undefined}
      className="group flex flex-col"
      style={{ perspective: 900 }}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative overflow-hidden bg-[#f5f5f5] mb-3"
      >
        {/* Image clip-path reveal */}
        <Link href={`/product/${product.slug}`}>
          <motion.div
            className="aspect-[3/4] overflow-hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            whileInView={{ clipPath: "inset(0 0 0% 0)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.75, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </motion.div>
        </Link>

        {/* Shimmer sweep on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-20"
          initial={{ x: "-120%", skewX: "-20deg", opacity: 0 }}
          whileHover={{ x: "160%", opacity: [0, 0.45, 0] }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", width: "50%" }}
        />

        {/* Badges */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-1">
          {discount && (
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="bg-primary text-white text-[10px] font-semibold uppercase px-2 py-0.5 leading-none"
            >
              -{discount}%
            </motion.span>
          )}
          {product.badge && (
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="bg-[#232323] text-white text-[10px] font-semibold uppercase px-2 py-0.5 leading-none flex items-center gap-1"
            >
              <Sparkles size={8} className="inline" /> {product.badge}
            </motion.span>
          )}
        </div>

        {/* Glow ring on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 rounded-none"
          initial={{ boxShadow: "inset 0 0 0px 0px rgba(192,132,252,0)" }}
          whileHover={{ boxShadow: "inset 0 0 0px 3px rgba(192,132,252,0.55)" }}
          transition={{ duration: 0.25 }}
        />

        {/* Quick add */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <Link href={`/product/${product.slug}`}>
            <button className="w-full py-3 text-[11px] font-semibold uppercase tracking-widest flex items-center justify-center gap-2 bg-white text-[#232323] hover:bg-primary hover:text-white transition-all duration-200">
              View Product
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 + index * 0.07 }}
      >
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
      </motion.div>
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="text-center mb-8 sm:mb-12">
      {eyebrow && (
        <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-semibold mb-2">{eyebrow}</p>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#232323] leading-tight">{title}</h2>
      {sub && (
        <p className="mt-2 text-gray-400 text-xs font-light tracking-widest uppercase">{sub}</p>
      )}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="w-10 h-px bg-primary/30" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <div className="w-10 h-px bg-primary/30" />
      </div>
    </div>
  );
}

export default function Home() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-baby-pink text-[#232323]">
      <Navbar />

      {/* ============================================================
          HERO — cinematic full-screen banner
          ============================================================ */}
      <section className="relative w-full h-[55vh] sm:h-[65vh] min-h-[320px] sm:min-h-[420px] overflow-hidden bg-[#1a1a1a]">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920&auto=format&fit=crop"
          alt="Senorita — New Collection 2026"
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          style={{ objectPosition: "60% 0%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative z-10 h-full flex items-center">
          <div className="px-6 sm:px-16 lg:px-24 max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="block mb-2 sm:mb-5 text-white/60 text-[9px] sm:text-[10px] uppercase font-light"
              style={{ letterSpacing: "0.4em", fontFamily: "'Poppins', sans-serif" }}
            >
              New Collection · 2026
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15 }}
              className="text-white mb-2 sm:mb-4"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "clamp(2.8rem, 11vw, 9.5rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.01em",
              }}
            >
              Senorita
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className="text-white/75 mb-4 sm:mb-8 max-w-[220px] sm:max-w-xs"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(0.85rem, 3vw, 1.05rem)",
                lineHeight: 1.6,
                letterSpacing: "0.01em",
              }}
            >
              Bold, vibrant styles made for girls who love to stand out.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              <Link
                href="/collections/all"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 sm:px-8 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold uppercase tracking-widest hover:bg-primary/85 transition-colors"
              >
                Shop Now <ArrowRight size={13} />
              </Link>
              <Link
                href="/category/new-arrivals"
                className="inline-flex items-center gap-2 bg-transparent border border-white/60 text-white px-6 sm:px-8 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold uppercase tracking-widest hover:bg-white hover:text-[#232323] transition-all"
              >
                New Arrivals
              </Link>
            </motion.div>
          </div>
        </div>

        {/* bottom scroll cue — hide on small screens */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 z-10 hidden sm:flex">
          <div className="w-px h-10 bg-white/30 relative overflow-hidden">
            <motion.div
              className="w-full bg-white absolute top-0"
              style={{ height: "40%" }}
              animate={{ y: ["-100%", "300%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          MARQUEE STRIP — luxury scrolling text
          ============================================================ */}
      <div className="bg-primary py-2 sm:py-3 overflow-hidden flex whitespace-nowrap">
        <div className="flex ticker-animation gap-0 text-[11px] tracking-[0.25em] uppercase text-white font-medium">
          {[...Array(3)].map((_, ri) => (
            <span key={ri} className="flex items-center">
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className={`mx-5 ${item === "✦" ? "opacity-50 text-base" : ""}`}>{item}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ============================================================
          TRUST BADGES
          ============================================================ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-6 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
          {TRUST_BADGES.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex flex-col items-center text-center gap-1 px-2 py-3 sm:px-4 sm:py-4"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <badge.icon size={15} className="text-primary" strokeWidth={1.7} />
              </div>
              <p className="text-[10px] sm:text-[12px] font-bold tracking-wide text-[#232323] leading-tight">{badge.label}</p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 leading-snug">{badge.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================================
          NEW ARRIVALS — editorial grid
          ============================================================ */}
      <section className="py-14 sm:py-20 bg-baby-pink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Just Dropped" title="New Arrivals" sub="Fresh styles added every week — be the first to own them." />

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] bg-gray-100 animate-pulse mb-3 rounded" />
                  <div className="h-4 bg-gray-100 animate-pulse w-3/4 mb-2 rounded" />
                  <div className="h-4 bg-gray-100 animate-pulse w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
            >
              {products.slice(0, 8).map((product, i) => (
                <NewArrivalPicture key={product.id} product={product} index={i} />
              ))}
            </motion.div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/collections/all"
              className="inline-flex items-center gap-2 border border-[#232323] text-[#232323] px-10 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#232323] hover:text-white transition-colors"
            >
              Explore All <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          SHOP BY CATEGORY — magazine-style tall tiles (dynamic)
          ============================================================ */}
      <section className="py-14 sm:py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Browse by Style" title="Shop by Category" sub="Discover your vibe across every category." />

          {catsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {categories.slice().sort((a, b) => a.order - b.order).map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.07, 0.5), duration: 0.5 }}
                >
                  <Link href={`/category/${cat.slug}`} className="group block relative overflow-hidden aspect-[3/4]">
                    <img
                      src={cat.image || "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop"}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 px-3 text-center">
                      <h3 className="font-serif text-base sm:text-lg font-bold text-white mb-1 leading-tight">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-white/55 text-[9px] uppercase tracking-[0.15em] font-light line-clamp-1 hidden sm:block">{cat.description}</p>
                      )}
                      <span className="mt-3 text-[9px] uppercase tracking-widest text-white border-b border-white/50 pb-px opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Shop Now
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          EDITORIAL BANNER — The Senorita Edit
          ============================================================ */}
      <section className="relative h-[340px] sm:h-[480px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop&crop=top"
          alt="The Senorita Edit"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/30 to-transparent" />
        <div className="relative z-10 h-full flex items-center px-8 sm:px-16 lg:px-24">
          <div className="max-w-lg">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-3 block"
            >
              Limited Collection
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
            >
              The Senorita Edit
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/75 text-sm font-light leading-relaxed mb-6 hidden sm:block max-w-sm tracking-wide"
            >
              Curated pieces for your most confident moments. Silks, co-ords, and statement looks.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <Link
                href="/collections/all"
                className="inline-flex items-center gap-2 bg-white text-[#232323] px-7 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
              >
                Explore <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BEST SELLERS
          ============================================================ */}
      <section className="py-14 sm:py-20 bg-baby-pink border-t border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Fan Favourites" title="Best Sellers" sub="Our most-loved picks — flying off the shelves." />

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] bg-gray-100 animate-pulse mb-3 rounded" />
                  <div className="h-4 bg-gray-100 animate-pulse w-3/4 mb-2 rounded" />
                  <div className="h-4 bg-gray-100 animate-pulse w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.slice(4, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          DUAL BANNER SPLIT
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {[
          {
            img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop",
            eyebrow: "Co-ords",
            title: "Mix & Match",
            sub: "Effortlessly coordinated sets for every occasion.",
            href: "/category/co-ords",
          },
          {
            img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop",
            eyebrow: "Dresses",
            title: "Dress to Impress",
            sub: "From day dates to night outs — we've got the dress.",
            href: "/category/dresses",
          },
        ].map((tile) => (
          <div key={tile.title} className="relative h-[380px] sm:h-[480px] overflow-hidden group cursor-pointer">
            <img
              src={tile.img}
              alt={tile.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-400" />
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8">
              <span className="text-white/60 text-[9px] uppercase tracking-[0.4em] mb-3">{tile.eyebrow}</span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">{tile.title}</h3>
              <p className="text-white/70 text-xs font-light mb-6 max-w-xs tracking-wide">{tile.sub}</p>
              <Link
                href={tile.href}
                className="inline-flex items-center gap-2 border border-white/70 text-white text-xs font-semibold uppercase tracking-widest px-6 py-2.5 hover:bg-white hover:text-[#232323] transition-all"
              >
                Shop Now <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* ============================================================
          CUSTOMER REVIEWS
          ============================================================ */}
      <section className="py-14 sm:py-20 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Happy Customers" title="What Girls Are Saying" sub="Real girls, real reviews — straight from the heart." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-baby-pink rounded-2xl p-5 border border-primary/8 flex flex-col gap-3"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={13} className={s < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                  ))}
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed flex-1">"{review.text}"</p>
                <p className="text-[9px] uppercase tracking-widest text-primary font-semibold">{review.product}</p>
                <div className="flex items-center gap-2.5 pt-2 border-t border-primary/10">
                  <img src={review.avatar} alt={review.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-[#232323]">{review.name}</p>
                    <p className="text-[10px] text-gray-400">{review.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          NEWSLETTER
          ============================================================ */}
      <section className="py-16 sm:py-24 bg-[#232323] border-t border-white/5">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-primary text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">Exclusive Access</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">Join the Club</h2>
          <p className="text-white/50 text-xs font-light mb-8 tracking-wide">
            Subscribe for early access, exclusive drops, and 10% off your first order.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 sm:gap-0 border border-white/15 overflow-hidden focus-within:border-primary transition-colors">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-5 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="bg-primary text-white px-7 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-primary/85 transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
