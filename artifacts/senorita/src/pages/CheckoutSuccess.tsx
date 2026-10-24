import { useEffect } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCartStore } from "@/stores/cart";

export default function CheckoutSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId") || params.get("session_id");
  const clearCart = useCartStore(s => s.clearCart);

  useEffect(() => { clearCart(); }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-[#232323] mb-3">Order Confirmed!</h1>
          <p className="text-gray-500 mb-2">Thank you for your purchase. We'll send you a confirmation soon.</p>
          {orderId && <p className="text-xs text-gray-400 mb-8 font-mono">Order ID: {orderId.slice(0, 8).toUpperCase()}</p>}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account/orders">
              <button className="flex items-center gap-2 bg-[#232323] text-white px-6 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-primary transition-colors">
                <Package size={16} /> Track Order
              </button>
            </Link>
            <Link href="/shop">
              <button className="flex items-center gap-2 border border-gray-200 text-[#232323] px-6 py-3 text-sm font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-colors">
                <ShoppingBag size={16} /> Continue Shopping
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
