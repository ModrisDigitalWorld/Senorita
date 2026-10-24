import { MapPin, Phone, Clock, Mail, Navigation } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function StoreLocator() {
  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      <div className="bg-[#f5f5f5] py-12 px-4 text-center">
        <p className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-2">Visit Us</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#232323]">Store Locator</h1>
        <p className="text-gray-400 text-sm mt-3">Come experience Senorita in person</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">

        <div className="grid md:grid-cols-2 gap-8 items-start">

          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-7 space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-primary mb-1">Flagship Store</p>
              <h2 className="font-serif text-2xl font-bold text-[#232323]">Senorita — Karnal</h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <MapPin size={17} className="text-primary flex-shrink-0 mt-0.5" strokeWidth={1.7} />
                <div>
                  <p className="font-semibold text-[#232323]">Address</p>
                  <p className="text-gray-500 mt-0.5">Karnal, Haryana, India</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone size={17} className="text-primary flex-shrink-0 mt-0.5" strokeWidth={1.7} />
                <div>
                  <p className="font-semibold text-[#232323]">Phone / WhatsApp</p>
                  <a href="tel:+917777000386" className="text-gray-500 hover:text-primary transition-colors mt-0.5 block">+91 7777 000 386</a>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail size={17} className="text-primary flex-shrink-0 mt-0.5" strokeWidth={1.7} />
                <div>
                  <p className="font-semibold text-[#232323]">Email</p>
                  <a href="mailto:senorita.store.karnal@gmail.com" className="text-gray-500 hover:text-primary transition-colors mt-0.5 block">senorita.store.karnal@gmail.com</a>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={17} className="text-primary flex-shrink-0 mt-0.5" strokeWidth={1.7} />
                <div>
                  <p className="font-semibold text-[#232323]">Store Hours</p>
                  <p className="text-gray-500 mt-0.5">Mon – Sun: 10am – 9pm IST</p>
                </div>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Karnal,Haryana"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-primary/85 transition-colors w-full justify-center"
            >
              <Navigation size={14} /> Get Directions
            </a>
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-100 h-80 bg-[#f0f0f0] flex items-center justify-center">
            <iframe
              title="Senorita Store — Karnal"
              src="https://maps.google.com/maps?q=Karnal,Haryana,India&z=13&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
