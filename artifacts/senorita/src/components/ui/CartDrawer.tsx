import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useCartStore } from "@/stores/cart";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#232323]" />
                <span className="font-semibold text-[#232323]">Cart ({totalItems()})</span>
              </div>
              <button onClick={closeCart} className="text-gray-400 hover:text-[#232323] transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <ShoppingBag size={48} className="text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium mb-1">Your cart is empty</p>
                  <p className="text-gray-400 text-sm mb-6">Add some items to get started</p>
                  <button onClick={closeCart} className="text-sm text-primary underline underline-offset-2">Continue Shopping</button>
                </div>
              ) : (
                <div className="px-5 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.productImage} alt={item.productName} className="w-20 h-24 object-cover bg-[#f5f5f5] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.productSlug}`} onClick={closeCart}>
                          <p className="text-sm font-medium text-[#232323] line-clamp-2 hover:text-primary transition-colors">{item.productName}</p>
                        </Link>
                        {item.variantLabel && <p className="text-xs text-gray-400 mt-0.5">Size: {item.variantLabel}</p>}
                        <p className="text-sm font-semibold text-[#232323] mt-1">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-gray-200">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors">
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-destructive transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-100 px-5 py-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-[#232323]">₹{totalPrice().toLocaleString("en-IN")}</span>
                </div>
                <p className="text-xs text-gray-400">Shipping calculated at checkout</p>
                <Link href="/checkout" onClick={closeCart}>
                  <button className="w-full bg-[#232323] hover:bg-primary text-white py-3.5 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-2">
                    Checkout <ArrowRight size={16} />
                  </button>
                </Link>
                <Link href="/shop" onClick={closeCart}>
                  <button className="w-full py-2.5 text-sm text-[#232323] hover:text-primary underline underline-offset-2 transition-colors">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
