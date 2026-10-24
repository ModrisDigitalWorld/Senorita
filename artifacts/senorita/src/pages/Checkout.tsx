import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Tag, X, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api, formatPrice } from "@/lib/api";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";

type Address = {
  name: string; email: string; phone: string;
  line1: string; line2: string;
  city: string; state: string; pincode: string;
};

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Chandigarh","Puducherry","Ladakh","Jammu and Kashmir",
];

const INPUT = "w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white placeholder-gray-400";
const LABEL = "block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();

  const [address, setAddress] = useState<Address>({
    name: user?.name || "", email: user?.email || "",
    phone: "", line1: "", line2: "",
    city: "", state: "", pincode: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = totalPrice();
  const shippingCost = subtotal >= 999 ? 0 : 99;
  const total = subtotal - couponDiscount + shippingCost;

  const setField = (k: keyof Address) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setAddress(a => ({ ...a, [k]: e.target.value }));

  const handleApplyCoupon = async () => {
    setCouponError("");
    try {
      const coupon = await api.post<any>("/coupons/validate", { code: couponInput, orderTotal: subtotal });
      setCouponCode(couponInput);
      if (coupon.type === "percentage") setCouponDiscount(Math.round(subtotal * coupon.value / 100));
      else if (coupon.type === "fixed") setCouponDiscount(coupon.value);
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon");
    }
  };

  const validateForm = (): boolean => {
    const required: (keyof Address)[] = ["name", "email", "phone", "line1", "city", "state", "pincode"];
    for (const k of required) {
      if (!address[k]) { setError(`Please fill in: ${k.replace(/([A-Z])/g, " $1")}`); return false; }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) { setError("Please enter a valid email address"); return false; }
    if (!/^\d{6}$/.test(address.pincode)) { setError("Please enter a valid 6-digit pincode"); return false; }
    if (!/^\d{10}$/.test(address.phone.replace(/\D/g, ""))) { setError("Please enter a valid 10-digit phone number"); return false; }
    return true;
  };

  const getCheckoutItems = () => items.map(i => ({
    productId: i.productId, name: i.productName,
    image: i.productImage, price: i.price, quantity: i.quantity,
    variantInfo: i.variantLabel ? { size: i.variantLabel } : null,
  }));

  const getShippingAddress = () => ({
    name: address.name,
    email: address.email,
    phone: address.phone,
    line1: address.line1,
    ...(address.line2 ? { line2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setError("Failed to load payment gateway. Please try again."); setLoading(false); return; }

      const order = await api.post<{
        orderId: string; razorpayOrderId: string;
        amount: number; currency: string; keyId: string;
      }>("/razorpay/create-order", {
        items: getCheckoutItems(),
        shippingAddress: getShippingAddress(),
        couponCode: couponCode || undefined,
      });

      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Senorita",
        description: `Order #${order.orderId.slice(0, 8).toUpperCase()}`,
        image: "/logo.png",
        prefill: {
          name: address.name,
          email: address.email,
          contact: address.phone,
        },
        theme: { color: "#c084fc" },
        handler: async (response: any) => {
          try {
            await api.post("/razorpay/verify-payment", {
              orderId: order.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            setLocation(`/checkout/success?orderId=${order.orderId}`);
          } catch {
            setError("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment was cancelled. Your order has not been placed.");
          },
        },
      });

      rzp.open();
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] text-center px-4">
          <div>
            <p className="text-xl text-gray-400 mb-2">Your cart is empty</p>
            <p className="text-sm text-gray-400 mb-6">Add some items before checking out.</p>
            <Link href="/shop"><button className="bg-[#232323] text-white px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-primary transition-colors">Continue Shopping</button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#232323]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => history.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors mb-6">
          <ChevronLeft size={16} /> Back
        </button>

        <h1 className="font-serif text-3xl font-bold text-[#232323] mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Left column ── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Contact details */}
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#232323] mb-5">Contact Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Full Name *</label>
                    <input type="text" value={address.name} onChange={setField("name")}
                      className={INPUT} placeholder="e.g. Priya Sharma" />
                  </div>
                  <div>
                    <label className={LABEL}>Phone Number *</label>
                    <input type="tel" value={address.phone} onChange={setField("phone")}
                      className={INPUT} placeholder="10-digit mobile number" maxLength={10} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Email Address * <span className="normal-case font-normal text-gray-400">(receipt will be sent here)</span></label>
                    <input type="email" value={address.email} onChange={setField("email")}
                      className={INPUT} placeholder="you@example.com" />
                  </div>
                </div>
              </div>

              {/* Delivery address */}
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#232323] mb-5">Delivery Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Address Line 1 *</label>
                    <input type="text" value={address.line1} onChange={setField("line1")}
                      className={INPUT} placeholder="House / Flat no., Street, Colony" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Address Line 2 <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                    <input type="text" value={address.line2} onChange={setField("line2")}
                      className={INPUT} placeholder="Landmark, Nearby area" />
                  </div>
                  <div>
                    <label className={LABEL}>City *</label>
                    <input type="text" value={address.city} onChange={setField("city")}
                      className={INPUT} placeholder="e.g. Karnal" />
                  </div>
                  <div>
                    <label className={LABEL}>Pincode *</label>
                    <input type="text" value={address.pincode} onChange={setField("pincode")}
                      className={INPUT} placeholder="6-digit pincode" maxLength={6} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>State *</label>
                    <select value={address.state} onChange={setField("state")} className={INPUT}>
                      <option value="">Select your state</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#232323] mb-4">Payment</h2>
                <div className="flex items-start gap-3 p-4 border-2 border-primary bg-primary/5 rounded-xl">
                  <div className="w-5 h-5 rounded-full border-2 border-primary mt-0.5 flex-shrink-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <CreditCard size={15} className="text-gray-600" />
                      <span className="text-sm font-semibold text-[#232323]">Pay Online</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">UPI, cards, net banking & more via Razorpay.</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck size={13} className="text-green-500 flex-shrink-0" />
                  <span>Secured by Razorpay — 100% safe & encrypted payment</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#232323] hover:bg-primary disabled:opacity-50 text-white py-4 text-sm font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                {loading ? "Opening Payment…" : `Pay Online · ${formatPrice(total)}`}
              </button>

              <p className="text-center text-[11px] text-gray-400">
                By placing your order you agree to our{" "}
                <Link href="/shipping-returns" className="underline hover:text-primary">Return Policy</Link>
              </p>
            </div>

            {/* ── Right column: Order summary ── */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-100 rounded-xl p-5 sticky top-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-5">Order Summary</h2>

                <div className="space-y-3 mb-5">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <img src={item.productImage} alt={item.productName}
                          className="w-14 object-cover bg-[#f5f5f5] rounded" style={{ height: "72px" }} />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#232323] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 leading-snug">{item.productName}</p>
                        {item.variantLabel && <p className="text-xs text-gray-400 mt-0.5">{item.variantLabel}</p>}
                        <p className="text-sm font-semibold mt-1">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  {!couponCode ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Coupon code" value={couponInput}
                          onChange={e => setCouponInput(e.target.value.toUpperCase())}
                          className="w-full border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <button type="button" onClick={handleApplyCoupon}
                        className="px-4 py-2 border border-gray-200 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 rounded">
                      <span className="text-sm text-green-700 font-medium">{couponCode} applied!</span>
                      <button type="button" onClick={() => { setCouponCode(""); setCouponDiscount(0); setCouponInput(""); }}
                        className="text-green-600 hover:text-green-800"><X size={14} /></button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon discount</span><span>−{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Truck size={12} /> Shipping</span>
                    <span>{shippingCost === 0
                      ? <span className="text-green-600 font-medium">FREE</span>
                      : formatPrice(shippingCost)}
                    </span>
                  </div>
                  {subtotal < 999 && (
                    <p className="text-[10px] text-gray-400">Add {formatPrice(999 - subtotal)} more for free shipping</p>
                  )}
                  <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100">
                    <span>Total</span><span className="text-primary">{formatPrice(total)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center pt-1">Secure payment via Razorpay</p>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
