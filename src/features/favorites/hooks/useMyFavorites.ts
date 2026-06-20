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
          "company_id, created_at, companies:company_id(id, name, description, neighborhood, city, logo_url, cover_url, is_featured, categories:category_id(name))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r) => r.companies as unknown as FavoriteCompany)
        .filter(Boolean);
    },
  });
}
