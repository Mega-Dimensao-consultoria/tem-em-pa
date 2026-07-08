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
  cityId?: string | null;
};

export type SearchedCompany = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  city_id: string | null;
  neighborhood_id: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  hours: unknown;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean | null;
  status: string;
  owner_id: string | null;
  category_id: string | null;
  created_at: string;
  categories: { name: string | null; slug: string | null; icon: string | null } | null;
  city: string | null;
  city_slug: string | null;
  neighborhood: string | null;
  neighborhood_slug: string | null;
};

export function useSearchCompanies({ q, cat, sort, userId, enabled, cityId }: SearchParams) {
  return useQuery({
    queryKey: [
      ...queryKeys.companies.search(q ?? "", cat ?? "", sort, userId ?? "anon"),
      cityId ?? "all",
    ],
    enabled,
    queryFn: async (): Promise<SearchedCompany[]> => {
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
          "id, name, slug, description, city_id, neighborhood_id, lat, lng, hours, logo_url, cover_url, is_featured, status, owner_id, category_id, created_at, categories:category_id(name, slug, icon), cities:city_id(name, slug, state), neighborhoods:neighborhood_id(name, slug)",
        )
        .limit(120);
      if (cityId) query = query.eq("city_id", cityId);
      if (sort === "name") query = query.order("name", { ascending: true });
      else query = query.order("created_at", { ascending: false });
      if (q) query = query.ilike("name", `%${q}%`);
      if (catId) query = query.eq("category_id", catId);
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as unknown as Array<
        Omit<SearchedCompany, "city" | "city_slug" | "neighborhood" | "neighborhood_slug" | "state"> & {
          cities: { name: string | null; slug: string | null; state: string | null } | null;
          neighborhoods: { name: string | null; slug: string | null } | null;
        }
      >).map((row) => ({
        ...row,
        city: row.cities?.name ?? null,
        city_slug: row.cities?.slug ?? null,
        state: row.cities?.state ?? null,
        neighborhood: row.neighborhoods?.name ?? null,
        neighborhood_slug: row.neighborhoods?.slug ?? null,
      })) as SearchedCompany[];

    },
  });
}

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
    score += Math.max(0, 5 - days / 30);
  }
  return score;
}
