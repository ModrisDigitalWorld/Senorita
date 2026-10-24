import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: any }>("/auth/register", form);
      setAuth(data.user, data.token);
      setLocation("/account");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-baby-pink flex items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-4xl text-[#232323]">Senorita</Link>
          <p className="text-gray-500 mt-2 text-sm">Create your account and start shopping!</p>
        </div>

        <div className="bg-white shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-[#232323] mb-6">Create Account</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-4 rounded">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[{ key: "name", label: "Full Name", type: "text", placeholder: "Your name" },
              { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              { key: "phone", label: "Phone (optional)", type: "tel", placeholder: "+91 98765 43210" },
              { key: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#232323] mb-1.5">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={set(key)} required={key !== "phone"}
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder={placeholder} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-[#232323] hover:bg-primary disabled:opacity-50 text-white py-3.5 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-2 mt-2">
              {loading ? "Creating account..." : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
