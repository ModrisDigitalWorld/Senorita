import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const tops = [
  { size: "XS", bust: "32", waist: "26", hip: "35", length: "22" },
  { size: "S",  bust: "34", waist: "28", hip: "37", length: "23" },
  { size: "M",  bust: "36", waist: "30", hip: "39", length: "24" },
  { size: "L",  bust: "38", waist: "32", hip: "41", length: "25" },
  { size: "XL", bust: "40", waist: "34", hip: "43", length: "25.5" },
  { size: "XXL",bust: "42", waist: "36", hip: "45", length: "26" },
];

const bottoms = [
  { size: "XS", waist: "26", hip: "35", inseam: "26", rise: "9" },
  { size: "S",  waist: "28", hip: "37", inseam: "27", rise: "9.5" },
  { size: "M",  waist: "30", hip: "39", inseam: "28", rise: "10" },
  { size: "L",  waist: "32", hip: "41", inseam: "28.5", rise: "10.5" },
  { size: "XL", waist: "34", hip: "43", inseam: "29", rise: "11" },
  { size: "XXL",waist: "36", hip: "45", inseam: "29.5", rise: "11.5" },
];

const tips = [
  { title: "Bust / Chest", desc: "Measure around the fullest part of your chest, keeping the tape parallel to the ground." },
  { title: "Waist", desc: "Measure around the narrowest part of your natural waist, usually just above the belly button." },
  { title: "Hip", desc: "Stand with feet together and measure around the fullest part of your hips and seat." },
  { title: "Between Sizes?", desc: "We recommend sizing up for a relaxed fit or sizing down for a more fitted look." },
];

export default function SizeGuide() {
  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <Navbar />

      <div className="bg-[#f5f5f5] py-12 px-4 text-center">
        <p className="text-primary text-[10px] uppercase tracking-[0.35em] font-semibold mb-2">Fit Guide</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#232323]">Size Guide</h1>
        <p className="text-gray-400 text-sm mt-3">All measurements are in inches. When in doubt, size up.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12">

        <div>
          <h2 className="font-serif text-2xl font-bold mb-5">Tops, Dresses & Co-ords</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#fafafa] text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                <tr>
                  {["Size", "Bust", "Waist", "Hip", "Length"].map(h => (
                    <th key={h} className="px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tops.map(r => (
                  <tr key={r.size} className="hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-4 font-bold text-primary">{r.size}</td>
                    <td className="px-5 py-4 text-gray-600">{r.bust}"</td>
                    <td className="px-5 py-4 text-gray-600">{r.waist}"</td>
                    <td className="px-5 py-4 text-gray-600">{r.hip}"</td>
                    <td className="px-5 py-4 text-gray-600">{r.length}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold mb-5">Bottoms & Skirts</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#fafafa] text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                <tr>
                  {["Size", "Waist", "Hip", "Inseam", "Rise"].map(h => (
                    <th key={h} className="px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bottoms.map(r => (
                  <tr key={r.size} className="hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-4 font-bold text-primary">{r.size}</td>
                    <td className="px-5 py-4 text-gray-600">{r.waist}"</td>
                    <td className="px-5 py-4 text-gray-600">{r.hip}"</td>
                    <td className="px-5 py-4 text-gray-600">{r.inseam}"</td>
                    <td className="px-5 py-4 text-gray-600">{r.rise}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold mb-5">How to Measure</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {tips.map(t => (
              <div key={t.title} className="bg-[#fafafa] border border-gray-100 rounded-xl p-5">
                <p className="font-semibold text-sm text-[#232323] mb-1">{t.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
