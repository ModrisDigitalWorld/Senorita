import { Link } from "wouter";
import { Instagram, Twitter, Youtube, Facebook } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-[#232323] text-white pt-10 sm:pt-16 pb-24 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-display text-3xl text-white mb-4">Senorita</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              High-fashion styles for the bold, the expressive, and the unapologetically you. New drops every Friday.
            </p>
            <div className="flex gap-3">
              <a
                href="https://wa.me/917777000386"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:border-[#25D366] hover:text-white transition-all duration-200"
              >
                <FaWhatsapp size={16} />
              </a>
              {[
                { Icon: Instagram, href: "https://www.instagram.com/senoritastore_karnal" },
                { Icon: Facebook, href: "#" },
                { Icon: Twitter, href: "#" },
                { Icon: Youtube, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:bg-primary hover:border-primary hover:text-white transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs mb-5">Shop</h4>
            <ul className="space-y-3">
              {[
                { label: "New Arrivals",      href: "/category/new-arrivals" },
                { label: "Best Sellers",      href: "/category/best-sellers" },
                { label: "Dresses",           href: "/category/dresses" },
                { label: "Co-ords",           href: "/category/co-ords" },
                { label: "Tops",              href: "/category/tops" },
                { label: "Sale",              href: "/sale" },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs mb-5">Help</h4>
            <ul className="space-y-3">
              {[
                { label: "FAQ",                href: "/faq" },
                { label: "Shipping & Returns", href: "/shipping-returns" },
                { label: "Track Order",        href: "/account/orders" },
                { label: "Size Guide",         href: "/size-guide" },
                { label: "Contact Us",         href: "/contact" },
                { label: "Store Locator",      href: "/store-locator" },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs mb-5">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>senorita.store.karnal@gmail.com</li>
              <li>
                <a href="https://wa.me/917777000386" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#25D366] transition-colors">
                  <FaWhatsapp size={13} className="text-[#25D366]" />
                  +91 7777 000 386
                </a>
              </li>
              <li>Mon – Sun: 10am – 9pm IST</li>
            </ul>
            <div className="mt-6">
              <h4 className="text-white font-semibold uppercase tracking-widest text-xs mb-3">We Accept</h4>
              <div className="flex gap-2">
                {["VISA", "MC", "UPI"].map(p => (
                  <span key={p} className="text-[10px] font-bold border border-white/20 text-gray-400 px-2 py-1 rounded-sm">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-7 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-xs">© 2026 Senorita. All Rights Reserved.</p>
          <div className="flex gap-5 text-xs text-gray-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
