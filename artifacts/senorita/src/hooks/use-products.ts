import { useQuery } from "@tanstack/react-query";
import { api, type ApiProduct } from "@/lib/api";

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  slug: string;
  category: string;
  categoryId?: string;
  badge?: string;
  stock?: number;
  isFeatured?: boolean;
  description?: string;
};

export function mapApiProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.salePrice ?? undefined,
    image: p.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    images: p.images,
    slug: p.slug,
    category: "",
    categoryId: p.categoryId ?? undefined,
    badge: p.badge ?? undefined,
    stock: p.stock,
    isFeatured: p.isFeatured,
    description: p.description,
  };
}

export function useProducts(params?: { category?: string; featured?: boolean; search?: string; limit?: number }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params?.category) search.set("category", params.category);
      if (params?.featured) search.set("featured", "true");
      if (params?.search) search.set("search", params.search);
      if (params?.limit) search.set("limit", String(params.limit));
      const data = await api.get<ApiProduct[]>(`/products?${search}`);
      return data.map(mapApiProduct);
    },
    staleTime: 60000,
  });
}
