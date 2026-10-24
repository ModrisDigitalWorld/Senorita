import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingCart, Package, Users, AlertTriangle, Plus, ClipboardList, Tag } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { AdminLayout } from "./AdminLayout";
import { api, formatPrice } from "@/lib/api";
import { useLocation } from "wouter";

type Stats = {
  totalRevenue: number; totalOrders: number; totalProducts: number; totalCustomers: number;
  recentOrders: any[]; salesByDay: { date: string; amount: number }[]; lowStockProducts: any[];
  ordersByStatus?: Record<string, number>;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700", shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
};

const STATUS_PIE_COLORS: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", processing: "#a855f7",
  shipped: "#6366f1", delivered: "#22c55e", cancelled: "#ef4444",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<Stats>("/admin/stats"),
  });

  const orderStatusData = stats?.recentOrders ? Object.entries(
    stats.recentOrders.reduce((acc: any, o: any) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })) : [];

  const quickActions = [
    { label: "Add Product", icon: Plus, action: () => setLocation("/admin/products"), color: "bg-primary text-white" },
    { label: "View Orders", icon: ClipboardList, action: () => setLocation("/admin/orders"), color: "bg-blue-500 text-white" },
    { label: "Manage Banners", icon: Tag, action: () => setLocation("/admin/banners"), color: "bg-purple-500 text-white" },
  ];

  const kpis = [
    { label: "Total Revenue", value: formatPrice(stats?.totalRevenue ?? 0), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Products", value: stats?.totalProducts ?? 0, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Customers", value: stats?.totalCustomers ?? 0, icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 animate-pulse h-24" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#232323]">Dashboard Overview</h1>
        <div className="flex gap-2">
          {quickActions.map(({ label, icon: Icon, action, color }) => (
            <button key={label} onClick={action}
              className={`hidden sm:flex items-center gap-1.5 ${color} px-3 py-2 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-[#232323]">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#232323] mb-4">Sales (Last 30 Days)</h2>
          {stats?.salesByDay?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.salesByDay} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(338 75% 52%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(338 75% 52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatPrice(v)} labelFormatter={d => d} />
                <Area type="monotone" dataKey="amount" stroke="hsl(338 75% 52%)" strokeWidth={2} fill="url(#sales)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No sales data yet</div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Order status donut */}
          {orderStatusData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[#232323] mb-3">Order Breakdown</h2>
              <div className="flex items-center gap-3">
                <PieChart width={80} height={80}>
                  <Pie data={orderStatusData} cx={35} cy={35} innerRadius={22} outerRadius={38} dataKey="value" paddingAngle={2}>
                    {orderStatusData.map((entry: any) => (
                      <Cell key={entry.name} fill={STATUS_PIE_COLORS[entry.name] || "#ccc"} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex-1 space-y-1">
                  {orderStatusData.map((entry: any) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: STATUS_PIE_COLORS[entry.name] || "#ccc" }} />
                        <span className="text-xs capitalize text-gray-500">{entry.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#232323]">{entry.value as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Low stock */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-orange-500" />
              <h2 className="text-sm font-semibold text-[#232323]">Low Stock</h2>
            </div>
            <div className="space-y-3">
              {stats?.lowStockProducts?.length ? stats.lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3">
                  <img src={p.images?.[0]} alt={p.name} className="w-9 h-9 object-cover rounded bg-[#f5f5f5] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#232323] truncate">{p.name}</p>
                    <p className={`text-xs font-semibold ${p.stock <= 5 ? "text-red-500" : "text-orange-500"}`}>{p.stock} left</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400">All products well stocked</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mt-6">
        <h2 className="text-sm font-semibold text-[#232323] mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs text-gray-400 font-medium">Order ID</th>
                <th className="text-left py-2 text-xs text-gray-400 font-medium">Customer</th>
                <th className="text-left py-2 text-xs text-gray-400 font-medium">Total</th>
                <th className="text-left py-2 text-xs text-gray-400 font-medium">Status</th>
                <th className="text-left py-2 text-xs text-gray-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.map((order: any) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-2.5 text-[#232323] font-medium">
                    {order.shippingAddress?.name || "—"}
                  </td>
                  <td className="py-2.5 font-semibold">{formatPrice(order.total)}</td>
                  <td className="py-2.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stats?.recentOrders?.length && <p className="text-sm text-gray-400 py-4 text-center">No orders yet</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
