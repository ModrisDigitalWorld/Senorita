import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Check, X, Pencil, ChevronDown } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { api, type ApiAdminReview } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

function StarRow({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={14}
            className={i <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editing, setEditing] = useState<ApiAdminReview | null>(null);
  const [editForm, setEditForm] = useState({ rating: 5, title: "", comment: "" });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => api.get<ApiAdminReview[]>("/admin/reviews"),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/admin/reviews/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); setEditing(null); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  const openEdit = (r: ApiAdminReview) => {
    setEditing(r);
    setEditForm({ rating: r.rating, title: r.title || "", comment: r.comment });
  };

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);

  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    rejected: reviews.filter(r => r.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#232323]">Reviews ({reviews.length})</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
              filter === f ? "bg-white text-[#232323] shadow-sm" : "text-gray-500 hover:text-[#232323]"
            }`}
          >
            {f} <span className="ml-0.5 opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No {filter === "all" ? "" : filter} reviews yet</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StarRow rating={review.rating} />
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[review.status]}`}>
                      {review.status}
                    </span>
                    {review.productName && (
                      <span className="text-[11px] text-gray-400 truncate">· {review.productName}</span>
                    )}
                  </div>
                  {review.title && <p className="font-semibold text-sm text-[#232323] mb-0.5">{review.title}</p>}
                  <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    — {review.userName}
                    {review.reviewerEmail && <span className="ml-1 opacity-70">({review.reviewerEmail})</span>}
                    <span className="mx-1">·</span>
                    {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {review.status !== "approved" && (
                    <button
                      onClick={() => update.mutate({ id: review.id, data: { status: "approved" } })}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-green-50 text-green-600 transition-colors"
                      title="Approve"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {review.status !== "rejected" && (
                    <button
                      onClick={() => update.mutate({ id: review.id, data: { status: "rejected" } })}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors"
                      title="Reject"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(review)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this review?")) remove.mutate(review.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#232323]">Edit Review</h3>
              <button onClick={() => setEditing(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2">Rating</label>
                <StarRow rating={editForm.rating} onChange={r => setEditForm(f => ({ ...f, rating: r }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Title</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="Optional title"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Comment</label>
                <textarea
                  value={editForm.comment}
                  onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={editing.status}
                  onChange={e => setEditing(prev => prev ? { ...prev, status: e.target.value } : null)}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => update.mutate({ id: editing.id, data: { rating: editForm.rating, title: editForm.title || null, comment: editForm.comment, status: editing.status } })}
                  disabled={update.isPending || !editForm.comment.trim()}
                  className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {update.isPending ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={() => setEditing(null)} className="px-4 py-2.5 border border-gray-200 text-sm hover:border-gray-300 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
