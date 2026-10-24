import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ChevronDown, Package, Mail, MailCheck } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { api, formatPrice } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700", shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => api.get<any[]>(`/admin/orders${filter ? `?status=${filter}` : ""}`),
  });

  const { data: orderDetail } = useQuery({
    queryKey: ["order-detail", selected?.id],
    queryFn: () => api.get<any>(`/orders/${selected.id}`),
    enabled: !!selected?.id,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/admin/orders/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      if (sendEmail) setEmailSent(true);
      setTimeout(() => { setSelected(null); setEmailSent(false); }, 800);
    },
  });

  const openOrder = (order: any) => {
    setSelected(order);
    setNewStatus(order.status);
    setTracking(order.trackingNumber || "");
    setSendEmail(true);
    setEmailSent(false);
  };

  const countByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o: any) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#232323]">Orders <span className="text-gray-400 font-normal">({orders.length})</span></h1>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(filter === s ? "" : s)}
            className={cn("text-center py-2.5 px-2 rounded-lg border transition-all text-xs",
              filter === s ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200")}>
            <p className={cn("text-xl font-bold", filter === s ? "text-primary" : "text-[#232323]")}>{countByStatus[s] || 0}</p>
            <p className="text-gray-400 capitalize mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("px-3 py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
              filter === s ? "bg-[#232323] text-white" : "border border-gray-200 text-gray-600 hover:border-primary hover:text-primary")}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {["Order ID", "Customer", "Total", "Payment", "Status", "Date", "Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>)}
                  </tr>
                ))
              ) : orders.map((order: any) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#232323] text-xs">{order.userName || order.shippingAddress?.name}</p>
                    <p className="text-[10px] text-gray-400">{order.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openOrder(order)} className="text-xs text-primary font-semibold hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && orders.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No orders found</p>}
        </div>
      </div>

      {/* Order detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-[#232323]">Order #{selected.id.slice(0, 8).toUpperCase()}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <button onClick={() => setSelected(null)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="p-5 space-y-6">
              {/* Customer */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Customer</p>
                <p className="text-sm font-medium text-[#232323]">{selected.userName || selected.shippingAddress?.name}</p>
                <p className="text-xs text-gray-400">{selected.userEmail}</p>
              </div>

              {/* Shipping Address */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Shipping Address</p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-[#232323]">{selected.shippingAddress?.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{selected.shippingAddress?.line1}{selected.shippingAddress?.line2 ? ", " + selected.shippingAddress.line2 : ""}</p>
                  <p className="text-gray-500 text-xs">{selected.shippingAddress?.city}, {selected.shippingAddress?.state} — {selected.shippingAddress?.pincode}</p>
                  {selected.shippingAddress?.phone && <p className="text-gray-500 text-xs">📞 {selected.shippingAddress.phone}</p>}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Items</p>
                {orderDetail?.items ? (
                  <div className="space-y-2">
                    {orderDetail.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#232323] truncate">{item.productName}</p>
                          {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#232323] flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Summary</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-primary text-base">{formatPrice(selected.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className={selected.paymentStatus === "paid" ? "text-green-600 font-semibold capitalize" : "text-yellow-600 font-semibold capitalize"}>
                      {selected.paymentMethod === "cod" ? "COD" : selected.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Update Order</p>
                <div className="relative mb-3">
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary appearance-none rounded">
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Tracking Number</label>
                  <input type="text" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="e.g. DL1234567890IN"
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary rounded" />
                </div>

                {/* Email toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer mb-4 select-none">
                  <div className={cn("w-10 h-5 rounded-full transition-colors relative", sendEmail ? "bg-primary" : "bg-gray-200")}
                    onClick={() => setSendEmail(s => !s)}>
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", sendEmail ? "left-5" : "left-0.5")} />
                  </div>
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    {emailSent ? <MailCheck size={14} className="text-green-500" /> : <Mail size={14} />}
                    {emailSent ? "Email sent!" : "Notify customer via email"}
                  </span>
                </label>

                <button onClick={() => update.mutate({ id: selected.id, status: newStatus, trackingNumber: tracking || null, sendEmail })}
                  disabled={update.isPending || emailSent}
                  className="w-full bg-primary text-white py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 rounded">
                  {update.isPending ? "Updating..." : emailSent ? "Updated!" : "Update Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
