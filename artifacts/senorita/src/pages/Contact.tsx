import { Mail, Phone, Clock, MapPin, Instagram, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const contacts = [
  { icon: Mail, label: "Email Us", value: "senorita.store.karnal@gmail.com", href: "mailto:senorita.store.karnal@gmail.com", cta: "Send Email" },
  { icon: Phone, label: "Call / WhatsApp", value: "+91 7777 000 386", href: "https://wa.me/917777000386", cta: "Chat on WhatsApp" },
  { icon: Clock, label: "Working Hours", value: "Mon – Sun: 10am – 9pm IST", href: null, cta: null },
  { icon: MapPin, label: "Store Location", value: "Karnal, Haryana, India", href: "https://maps.google.com/?q=Karnal,Haryana", cta: "Get Directions" },
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      <div className="bg-[#f5f5f5] py-12 px-4 text-center">
        <p className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-2">Get in Touch</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#232323]">Contact Us</h1>
        <p className="text-gray-400 text-sm mt-3">We're here to help, Mon – Sun, 10am – 8pm IST</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">

        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {contacts.map(c => (
            <div key={c.label} className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 flex gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <c.icon size={20} className="text-primary" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">{c.label}</p>
                <p className="text-[#232323] font-medium text-sm mb-2">{c.value}</p>
                {c.href && c.cta && (
                  <a href={c.href} target="_blank" rel="noreferrer"
                    className="text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-75 transition-opacity">
                    {c.cta} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#232323] rounded-2xl p-8 sm:p-10 text-center">
          <Instagram size={28} className="text-primary mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="font-serif text-2xl font-bold text-white mb-2">Follow Us on Instagram</h2>
          <p className="text-gray-400 text-sm mb-6">New drops, styling tips, and exclusive deals — all on our Instagram.</p>
          <a href="https://www.instagram.com/senoritastore_karnal" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-primary/85 transition-colors rounded-none">
            <Instagram size={14} /> @senoritastore_karnal
          </a>
        </div>

      </div>

      <Footer />
    </div>
  );
}
