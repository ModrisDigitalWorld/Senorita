import { motion } from "framer-motion";
import { Heart, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const values = [
  {
    icon: Heart,
    title: "Made for You",
    desc: "Every piece is chosen with the modern Indian woman in mind — bold, expressive, and unapologetically herself.",
  },
  {
    icon: Sparkles,
    title: "Fresh Every Week",
    desc: "New drops every Friday. We stay on top of trends so you always have something exciting to look forward to.",
  },
  {
    icon: Truck,
    title: "Pan India Delivery",
    desc: "We ship to every corner of India with fast, reliable delivery and secure online payments via Razorpay.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assured",
    desc: "Every item is quality-checked before it leaves our store. If something isn't right, we make it right.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[340px] overflow-hidden bg-[#1a1a1a]">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop"
          alt="About Senorita"
          className="absolute inset-0 w-full h-full object-cover opacity-60 object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 h-full flex items-center px-8 sm:px-16 lg:px-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-primary text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">Our Story</p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-white leading-tight mb-4">About Senorita</h1>
            <p className="text-white/70 text-sm font-light max-w-sm leading-relaxed">
              Fashion that celebrates every woman — bold, vibrant, and made for those who love to stand out.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <p className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-4">Who We Are</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#232323] mb-6 leading-snug">
              Born in Karnal, Dressed for Every Girl in India
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-5 max-w-2xl mx-auto">
              Senorita started with a simple belief — that great fashion shouldn't come with a great price tag. Based in Karnal, Haryana, we curate bold, trend-forward styles for the modern Indian woman who wants to express herself without compromise.
            </p>
            <p className="text-gray-500 text-base leading-relaxed max-w-2xl mx-auto">
              From chic co-ords and stunning dresses to everyday tops and ethnic wear — every piece in our collection is handpicked for quality, fit, and style. We believe fashion is for everyone, and we're here to prove it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#fafafa] border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-3">What We Stand For</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#232323]">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon size={20} className="text-primary" strokeWidth={1.7} />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#232323] mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <p className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-4">Join the Family</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#232323] mb-4">Ready to Find Your Style?</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">Explore our latest collection and discover pieces made just for you.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/shop">
              <button className="bg-[#232323] text-white px-10 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-colors">
                Shop Now
              </button>
            </Link>
            <Link href="/contact">
              <button className="border border-[#232323] text-[#232323] px-10 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#232323] hover:text-white transition-colors">
                Contact Us
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
