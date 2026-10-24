import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { api } from "@/lib/api";

export default function AdminCustomers() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => api.get<any[]>("/admin/customers"),
  });

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Users size={20} className="text-[#232323]" />
        <h1 className="text-xl font-semibold text-[#232323]">Customers ({customers.length})</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {["#", "Name", "Email", "Phone", "Joined"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>)}
                  </tr>
                ))
              ) : customers.map((c, i) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-[#232323]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && customers.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No customers yet</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
