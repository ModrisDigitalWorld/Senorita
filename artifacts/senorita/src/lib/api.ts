// const API_BASE = "http://localhost:5000/api";
const API_BASE = "https://senorita-y5p8.vercel.app/api";

function getToken(): string | null {
  return localStorage.getItem("senorita_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type ApiProduct = {
  id: string; name: string; slug: string; price: number; salePrice: number | null;
  stock: number; images: string[]; badge: string | null; isFeatured: boolean;
  categoryId: string | null; description: string; tags: string[]; createdAt: string;
  variants?: ApiVariant[];
};
export type ApiVariant = { id: string; type: string; value: string; stock: number; priceModifier: number };
export type ApiCategory = {
  id: string; name: string; slug: string; image: string | null;
  description: string | null; order: number;
  similarProductIds: string[] | null;
  defaultSizes: string[];
  defaultColors: string[];
  similarProducts?: ApiProduct[];
};
export type ApiUser = { id: string; name: string; email: string; role: string; phone: string | null };
export type ApiOrder = {
  id: string; status: string; paymentStatus: string; subtotal: number; discount: number;
  shippingCost: number; total: number; createdAt: string; trackingNumber: string | null;
  shippingAddress: { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  items: ApiOrderItem[];
};
export type ApiOrderItem = { id: string; productId: string | null; productName: string; productImage: string | null; quantity: number; price: number };
export type ApiCartItem = {
  id: string; quantity: number; productId: string; variantId: string | null;
  productName: string; productSlug: string; productPrice: number; productSalePrice: number | null;
  productImages: string[]; productStock: number;
};
export type ApiWishlistItem = { id: string; productId: string; productName: string; productSlug: string; productPrice: number; productSalePrice: number | null; productImages: string[]; productBadge: string | null };
export type ApiReview = { id: string; rating: number; title: string | null; comment: string; createdAt: string; userName: string; reviewerEmail?: string | null; status?: string; productId?: string; productName?: string | null };
export type ApiAdminReview = ApiReview & { status: string; productId: string; productName: string | null; reviewerEmail: string | null };
export type ApiCoupon = { id: string; code: string; type: string; value: number; minOrder: number; maxUses: number | null; usedCount: number; expiresAt: string | null; isActive: boolean };

export function formatPrice(paise: number) {
  return `₹${paise.toLocaleString("en-IN")}`;
}
