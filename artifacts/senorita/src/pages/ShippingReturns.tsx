import { Truck, RefreshCw, PackageCheck, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const sections = [
  {
    icon: Truck,
    title: "Shipping Policy",
    items: [
      { heading: "Standard Delivery", body: "3–5 business days across India. Free shipping on orders above ₹999." },
      { heading: "Express Delivery", body: "Available for select pin codes at ₹99 extra. Delivered in 1–2 business days." },
      { heading: "Order Processing", body: "Orders are processed within 24 hours of placement (Mon–Sun, 10am–9pm IST)." },
    ],
  },
  {
    icon: RefreshCw,
    title: "Returns & Exchanges",
    items: [
      { heading: "7-Day Return Window", body: "Returns accepted within 7 days of delivery. Item must be unused, unwashed, with all tags intact and original packaging." },
      { heading: "Exchange Process", body: "To exchange a size or colour, initiate a request via email or WhatsApp. Exchanges are subject to stock availability." },
      { heading: "Non-Returnable Items", body: "Sale items, accessories, and items marked as final sale cannot be returned or exchanged." },
      { heading: "Refund Timeline", body: "Refunds are processed within 5–7 business days after the returned item is received and inspected." },
    ],
  },
  {
    icon: PackageCheck,
    title: "Damaged or Wrong Item",
    items: [
      { heading: "Report Within 48 Hours", body: "If you receive a damaged, defective, or wrong item, please contact us within 48 hours of delivery with photos of the item and packaging." },
      { heading: "Resolution", body: "We will arrange a free pickup and either send a replacement or issue a full refund — your choice." },
    ],
  },
  {
    icon: Clock,
    title: "How to Initiate a Return",
    items: [
      { heading: "Step 1", body: "Email senorita.store.karnal@gmail.com or WhatsApp us at +91 7777 000 386 with your order number and reason for return." },
      { heading: "Step 2", body: "Our team will confirm eligibility and share the return pickup details within 24 hours." },
      { heading: "Step 3", body: "Pack the item securely in its original packaging. Our courier partner will pick it up from your address." },
      { heading: "Step 4", body: "Once received and inspected, we will process your refund or exchange within 5–7 business days." },
    ],
  },
];

export default function ShippingReturns() {
  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      <div className="bg-[#f5f5f5] py-12 px-4 text-center">
        <p className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-2">Policies</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#232323]">Shipping & Returns</h1>
        <p className="text-gray-400 text-sm mt-3">Questions? Reach us at senorita.store.karnal@gmail.com</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12">
        {sections.map(s => (
          <div key={s.title}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <s.icon size={18} className="text-primary" strokeWidth={1.7} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#232323]">{s.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {s.items.map(item => (
                <div key={item.heading} className="bg-[#fafafa] border border-gray-100 rounded-xl p-5">
                  <p className="font-semibold text-sm text-[#232323] mb-1">{item.heading}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
