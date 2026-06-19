import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/categories.functions";

export const categoriesQueryKey = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  });
}
