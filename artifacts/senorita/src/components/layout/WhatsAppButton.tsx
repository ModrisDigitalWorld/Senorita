import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "917777000386";
const PREFILLED_MESSAGE = encodeURIComponent("Hi Senorita Store! I need help with my order.");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${PREFILLED_MESSAGE}`;

export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-4 sm:bottom-8 sm:right-6 z-50 flex items-center justify-center w-13 h-13 bg-[#25D366] rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
      style={{ width: 52, height: 52 }}
    >
      <FaWhatsapp size={28} color="white" />
    </a>
  );
}
