import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Standard delivery takes 3–5 business days across India. Express delivery (1–2 days) is available for select pin codes at an additional charge.",
  },
  {
    q: "How do I return or exchange a product?",
    a: "Returns and exchanges are accepted within 7 days of delivery. The product must be unused, unwashed, and in its original packaging with all tags intact. Please visit our Shipping & Returns page or email us to initiate a return.",
  },
  {
    q: "Are the colours accurate to the photos?",
    a: "We do our best to represent colours accurately. However, slight variations may occur due to different screen calibrations. If you're unsure, feel free to reach out to us.",
  },
  {
    q: "How do I know which size to pick?",
    a: "We recommend checking our Size Guide page for detailed measurements. If you are between two sizes, we generally suggest sizing up for a more comfortable fit.",
  },
  {
    q: "Can I cancel my order after placing it?",
    a: "Orders can be cancelled within 12 hours of placement. Once dispatched, cancellations are not possible. Please contact us immediately at senorita.store.karnal@gmail.com or call +91 7777 000 386.",
  },
  {
    q: "Do you ship outside India?",
    a: "Currently we ship only within India. International shipping is coming soon — follow us on Instagram @senoritastore_karnal for updates.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order is shipped, you will receive a tracking link via SMS and email. You can also visit My Account → Orders to track your shipment.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, credit/debit cards (Visa, Mastercard), net banking, and wallets — all via Razorpay's secure payment gateway.",
  },
  {
    q: "Are there any ongoing offers or discount codes?",
    a: "We run seasonal sales and exclusive drops regularly. Subscribe to our newsletter or follow us on Instagram @senoritastore_karnal to stay updated!",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="font-medium text-[#232323] text-sm sm:text-base group-hover:text-primary transition-colors">{q}</span>
        <ChevronDown
          size={18}
          className={cn("flex-shrink-0 text-gray-400 transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      {open && (
        <p className="text-gray-500 text-sm leading-relaxed pb-5">{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      <div className="bg-[#f5f5f5] py-12 px-4 text-center">
        <p className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-2">Support</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#232323]">Frequently Asked Questions</h1>
        <p className="text-gray-400 text-sm mt-3">Can't find what you're looking for? Email us at senorita.store.karnal@gmail.com</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        {FAQS.map(f => <Item key={f.q} q={f.q} a={f.a} />)}
      </div>

      <Footer />
    </div>
  );
}
