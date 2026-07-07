import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

export type SearchSort = "relevance" | "recent" | "name" | "distance";

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
          "id, name, slug, description, neighborhood, city, state, lat, lng, hours, logo_url, cover_url, is_featured, status, owner_id, category_id, created_at, categories:category_id(name, slug, icon)",
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

/**
 * Client-side relevance score. Higher is better.
 * - exact/prefix/substring name match against the query
 * - featured boost, description/logo completeness, mild recency
 */
export function scoreCompanyRelevance(
  c: {
    name: string;
    description?: string | null;
    logo_url?: string | null;
    is_featured?: boolean | null;
    created_at?: string | null;
  },
  q: string | undefined,
): number {
  let score = 0;
  const name = (c.name ?? "").toLowerCase();
  const query = (q ?? "").trim().toLowerCase();
  if (query) {
    if (name === query) score += 100;
    else if (name.startsWith(query)) score += 60;
    else if (name.includes(query)) score += 25;
  }
  if (c.is_featured) score += 15;
  if (c.description && c.description.trim().length > 40) score += 5;
  if (c.logo_url) score += 3;
  if (c.created_at) {
    const days = (Date.now() - new Date(c.created_at).getTime()) / 86_400_000;
    // slight boost for newer listings, capped at ~5 points
    score += Math.max(0, 5 - days / 30);
  }
  return score;
}
