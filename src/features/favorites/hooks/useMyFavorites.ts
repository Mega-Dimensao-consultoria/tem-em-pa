import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import { queryKeys } from "@/lib/queryKeys";

export type FavoriteCompany = {
  id: string;
  name: string;
  description: string | null;
  neighborhood: string | null;
  city: string | null;
  city_slug: string | null;
  neighborhood_slug: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean | null;
  categories: { name: string | null } | null;
};

/** Companies the signed-in user has favorited, most recent first. */
export function useMyFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.favorites.mine(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<FavoriteCompany[]> => {
      const { data, error } = await supabase
        .from("favorites")
        .select(
          "company_id, created_at, companies:company_id(id, name, description, logo_url, cover_url, is_featured, categories:category_id(name), cities:city_id(name, slug), neighborhoods:neighborhood_id(name, slug))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r) => {
          const c = r.companies as unknown as {
            id: string;
            name: string;
            description: string | null;
            logo_url: string | null;
            cover_url: string | null;
            is_featured: boolean | null;
            categories: { name: string | null } | null;
            cities: { name: string | null; slug: string | null } | null;
            neighborhoods: { name: string | null; slug: string | null } | null;
          } | null;
          if (!c) return null;
          return {
            id: c.id,
            name: c.name,
            description: c.description,
            logo_url: c.logo_url,
            cover_url: c.cover_url,
            is_featured: c.is_featured,
            categories: c.categories,
            city: c.cities?.name ?? null,
            city_slug: c.cities?.slug ?? null,
            neighborhood: c.neighborhoods?.name ?? null,
            neighborhood_slug: c.neighborhoods?.slug ?? null,
          } as FavoriteCompany;
        })
        .filter((v): v is FavoriteCompany => !!v);
    },
  });
}
