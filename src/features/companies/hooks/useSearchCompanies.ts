import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

export type SearchSort = "recent" | "name" | "distance";

export type SearchParams = {
  q?: string;
  cat?: string;
  sort: SearchSort;
  userId: string | undefined;
  enabled: boolean;
};

export function useSearchCompanies({ q, cat, sort, userId, enabled }: SearchParams) {
  return useQuery({
    queryKey: queryKeys.companies.search(q ?? "", cat ?? "", sort, userId ?? "anon"),
    enabled,
    queryFn: async () => {
      let catId: string | null = null;
      if (cat) {
        const { data: c } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", cat)
          .maybeSingle();
        catId = c?.id ?? null;
      }
      let query = supabase
        .from("companies")
        .select(
          "id, name, slug, description, neighborhood, city, state, lat, lng, hours, logo_url, cover_url, is_featured, status, owner_id, category_id, categories:category_id(name, slug, icon)",
        )
        .limit(120);
      if (sort === "name") query = query.order("name", { ascending: true });
      else query = query.order("created_at", { ascending: false });
      if (q) query = query.ilike("name", `%${q}%`);
      if (catId) query = query.eq("category_id", catId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
