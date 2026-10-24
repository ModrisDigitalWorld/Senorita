import { Home, ShoppingBag, LayoutGrid, Phone, Search } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useCartStore } from "@/stores/cart";

export default function BottomNav() {
  const [location] = useLocation();
  const { totalItems, openCart } = useCartStore();
  const count = totalItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg sm:hidden">
      <div className="flex items-center justify-around h-16 px-1 safe-pb">

        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${location === "/" ? "text-primary" : "text-gray-500"}`}
        >
          <Home size={21} strokeWidth={location === "/" ? 2.2 : 1.8} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${location.startsWith("/shop") || location.startsWith("/category") ? "text-primary" : "text-gray-500"}`}
        >
          <Search size={21} strokeWidth={location.startsWith("/shop") ? 2.2 : 1.8} />
          <span className="text-[10px] font-medium">Shop</span>
        </Link>

        <Link
          href="/shop"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors text-gray-500"
        >
          <LayoutGrid size={21} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">Browse</span>
        </Link>

        <button
          onClick={openCart}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors text-gray-500 hover:text-primary relative"
        >
          <div className="relative">
            <ShoppingBag size={21} strokeWidth={1.8} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Cart</span>
        </button>

        <Link
          href="/contact"
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${location === "/contact" ? "text-primary" : "text-gray-500"}`}
        >
          <Phone size={21} strokeWidth={location === "/contact" ? 2.2 : 1.8} />
          <span className="text-[10px] font-medium">Contact</span>
        </Link>

      </div>
    </nav>
  );
}
