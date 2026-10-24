import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Package, Heart, MapPin, LogOut, ChevronRight, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api, type ApiOrder, type ApiWishlistItem, formatPrice } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Account() {
  const [tab, setTab] = useState<"orders" | "wishlist" | "profile">("orders");
  const { user, logout, isLoggedIn } = useAuthStore();
  const addItem = useCartStore(s => s.addItem);
  const [, setLocation] = useLocation();

  if (!isLoggedIn()) {
    setLocation("/login");
    return null;
  }

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get<ApiOrder[]>("/orders"),
    enabled: tab === "orders",
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api.get<ApiWishlistItem[]>("/wishlist"),
    enabled: tab === "wishlist",
  });

  const handleLogout = () => { logout(); setLocation("/"); };

  const tabs = [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "profile", label: "Profile", icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start gap-8">
          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0 hidden md:block">
            <div className="bg-[#f9f9f9] p-5 mb-4">
              <p className="font-semibold text-[#232323]">{user?.name}</p>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            </div>
            <nav className="space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id as any)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors",
                    tab === id ? "bg-primary text-white" : "text-[#232323] hover:bg-[#f5f5f5]")}>
                  <Icon size={16} /> {label} <ChevronRight size={14} className="ml-auto" />
                </button>
              ))}
              {user?.role === "admin" && (
                <Link href="/admin/dashboard">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left text-purple-600 hover:bg-purple-50 transition-colors">
                    <Star size={16} /> Admin Panel <ChevronRight size={14} className="ml-auto" />
                  </button>
                </Link>
              )}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={16} /> Sign Out <ChevronRight size={14} className="ml-auto" />
              </button>
            </nav>
          </aside>

          {/* Mobile tabs */}
          <div className="md:hidden w-full">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map(({ id, label }) => (
                <button key={id} onClick={() => setTab(id as any)}
                  className={cn("px-4 py-2 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
                    tab === id ? "bg-[#232323] text-white" : "border border-gray-200 text-[#232323]")}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {tab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold mb-5">My Orders</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-gray-200">
                    <Package size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400">No orders yet</p>
                    <Link href="/shop"><button className="mt-4 text-sm text-primary underline">Start Shopping</button></Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="border border-gray-100 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                          </div>
                          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full uppercase", STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600")}>{order.status}</span>
                        </div>
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                          {order.items?.slice(0, 5).map(item => (
                            <div key={item.id} className="flex-shrink-0">
                              {item.productImage && <img src={item.productImage} alt={item.productName} className="w-14 h-14 object-cover bg-[#f5f5f5]" />}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                          {order.trackingNumber && <p className="text-xs text-gray-500">Tracking: {order.trackingNumber}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "wishlist" && (
              <motion.div key="wishlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold mb-5">My Wishlist ({wishlist.length})</h2>
                {wishlist.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-gray-200">
                    <Heart size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400">Your wishlist is empty</p>
                    <Link href="/shop"><button className="mt-4 text-sm text-primary underline">Browse Products</button></Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {wishlist.map(item => (
                      <div key={item.id} className="group">
                        <Link href={`/product/${item.productSlug}`}>
                          <div className="aspect-[3/4] overflow-hidden bg-[#f5f5f5] mb-2">
                            <img src={item.productImages?.[0]} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        </Link>
                        <p className="text-sm font-medium line-clamp-2">{item.productName}</p>
                        <p className="text-sm font-semibold mt-0.5">{formatPrice(item.productSalePrice ?? item.productPrice)}</p>
                        <button onClick={() => addItem({ id: `${item.productId}-wl`, productId: item.productId, productName: item.productName, productSlug: item.productSlug, productImage: item.productImages?.[0] || "", price: item.productSalePrice ?? item.productPrice, quantity: 1 })}
                          className="mt-2 w-full border border-gray-200 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#232323] hover:text-white hover:border-[#232323] transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold mb-5">Profile</h2>
                <div className="border border-gray-100 p-6 max-w-md space-y-4">
                  {[
                    { label: "Name", value: user?.name },
                    { label: "Email", value: user?.email },
                    { label: "Phone", value: user?.phone || "—" },
                    { label: "Role", value: user?.role },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm text-[#232323]">{value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={handleLogout} className="mt-6 flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
                  <LogOut size={15} /> Sign Out
                </button>
              </motion.div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
