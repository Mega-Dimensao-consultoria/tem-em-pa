import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/features/companies/functions/categories";

export const categoriesQueryKey = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  });
}
