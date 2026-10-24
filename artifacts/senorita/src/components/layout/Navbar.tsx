import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, Menu, X, Heart, User, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [, setLocation] = useLocation();
  const totalItems = useCartStore(s => s.totalItems);
  const openCart = useCartStore(s => s.openCart);
  const { user, isLoggedIn, isAdmin } = useAuthStore();

  const navLinksLeft: { name: string; href: string }[] = [];
  const navLinksRight = [
    { name: "About", href: "/about" },
  ];

  const mobileLinks = [
    { name: "Home",              href: "/" },
    { name: "Shop All",          href: "/shop" },
    { name: "New Arrivals",      href: "/category/new-arrivals" },
    { name: "Dresses",           href: "/category/dresses" },
    { name: "Co-ords",           href: "/category/co-ords" },
    { name: "Tops",              href: "/category/tops" },
    { name: "Sale",              href: "/sale" },
    { name: "About",             href: "/about" },
    { name: "FAQ",               href: "/faq" },
    { name: "Contact",           href: "/contact" },
    { name: "Shipping & Returns",href: "/shipping-returns" },
    { name: "Size Guide",        href: "/size-guide" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
      setIsSearchOpen(false);
      setSearchVal("");
    }
  };

  return (
    <>
      <div className="bg-[#232323] text-white py-2.5 overflow-hidden flex whitespace-nowrap z-50 relative">
        <div className="flex ticker-animation text-xs tracking-wider">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="mx-8 flex items-center gap-6">
              <span>Welcome To Senorita</span>
              <span className="opacity-50">|</span>
              <span>Free Shipping on Orders Over ₹999</span>
              <span className="opacity-50">|</span>
              <span>New Arrivals Every Friday</span>
              <span className="opacity-50">|</span>
              <Link href="/shop" className="underline underline-offset-2 font-semibold">Shop Now</Link>
            </span>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center gap-3 sm:gap-5">
              <button className="lg:hidden text-[#232323] hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={22} />
              </button>

              <Link href="/" className="flex items-center">
                <img
                  src="/logo-black.png"
                  alt="Senorita"
                  className="h-20 sm:h-24 w-auto object-contain"
                />
              </Link>

              <nav className="hidden lg:flex items-center gap-7 ml-2">
                {navLinksLeft.map(link => (
                  <Link key={link.name} href={link.href} className="text-sm font-medium text-[#232323] hover:text-primary transition-colors uppercase tracking-wide">
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <nav className="hidden lg:flex items-center gap-7">
                {navLinksRight.map(link => (
                  <Link key={link.name} href={link.href} className={cn("text-sm font-medium uppercase tracking-wide transition-colors", link.sale ? "text-primary font-semibold" : "text-[#232323] hover:text-primary")}>
                    {link.name}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <button className="text-[#232323] hover:text-primary transition-colors" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                  <Search size={20} />
                </button>

                {isLoggedIn() && (
                  <div className="relative group">
                    <button className="text-[#232323] hover:text-primary transition-colors flex items-center gap-1">
                      <User size={20} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="px-3 py-2.5 border-b border-gray-100">
                        <p className="text-xs font-medium text-[#232323] truncate">{user?.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <Link href="/account">
                        <button className="w-full text-left px-3 py-2 text-xs text-[#232323] hover:bg-gray-50 transition-colors">My Account</button>
                      </Link>
                      <Link href="/account/orders">
                        <button className="w-full text-left px-3 py-2 text-xs text-[#232323] hover:bg-gray-50 transition-colors">My Orders</button>
                      </Link>
                      {isAdmin() && (
                        <Link href="/admin/dashboard">
                          <button className="w-full text-left px-3 py-2 text-xs text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-1.5">
                            <LayoutDashboard size={12} /> Admin Panel
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <button className="text-[#232323] hover:text-primary transition-colors relative" onClick={openCart}>
                  <ShoppingBag size={20} />
                  {totalItems() > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold leading-none">
                      {totalItems() > 9 ? "9+" : totalItems()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="border-t border-gray-100 overflow-hidden bg-white">
              <div className="max-w-xl mx-auto px-4 py-3">
                <form onSubmit={handleSearch} className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="search" placeholder="Search products..." autoFocus value={searchVal} onChange={e => setSearchVal(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:border-primary bg-white text-[#232323] placeholder:text-gray-400" />
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.28 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl flex flex-col">
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                <span className="font-display text-2xl text-[#232323]">Senorita</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#232323] hover:text-primary"><X size={22} /></button>
              </div>
              <nav className="flex flex-col py-2 overflow-y-auto flex-1">
                {mobileLinks.map(link => (
                  <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                    className={cn("px-5 py-3 text-sm font-medium border-b border-gray-50 transition-colors",
                      link.name === "Sale" ? "text-primary uppercase tracking-wide" : "text-[#232323] hover:text-primary uppercase tracking-wide")}>
                    {link.name}
                  </Link>
                ))}
              </nav>
              {isLoggedIn() && (
                <div className="p-5 border-t border-gray-100">
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full bg-[#232323] text-white py-2.5 text-sm font-semibold uppercase tracking-wider">My Account</button>
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
