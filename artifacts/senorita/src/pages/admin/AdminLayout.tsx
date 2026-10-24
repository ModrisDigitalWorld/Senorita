import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Tag, Ticket, Menu, X, ChevronRight, LogOut, Store, Image, MessageSquare, Palette, Layers
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/stock", label: "Stock", icon: Layers },
  { href: "/admin/sizes-colors", label: "Sizes & Colours", icon: Palette },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-[#f9fafb]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/" className="font-display text-2xl text-[#232323]">Senorita</Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-[#232323]">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-3">Admin Panel</div>

        <nav className="flex-1 px-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location === href || location.startsWith(href + "/")
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#232323]"
              )}>
                <Icon size={17} /> {label}
                <ChevronRight size={13} className="ml-auto opacity-50" />
              </button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-[#232323] rounded-lg hover:bg-gray-50 transition-colors">
              <Store size={16} /> View Store
            </button>
          </Link>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#232323] truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-[#232323]">
            <Menu size={22} />
          </button>
          <div className="flex-1">
            {NAV.find(n => location === n.href || location.startsWith(n.href + "/"))?.label || "Admin"}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
