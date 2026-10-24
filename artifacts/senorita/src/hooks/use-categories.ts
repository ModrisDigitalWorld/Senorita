import { useQuery } from "@tanstack/react-query";
import { api, type ApiCategory } from "@/lib/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiCategory[]>("/categories"),
    staleTime: 120000,
  });
}
