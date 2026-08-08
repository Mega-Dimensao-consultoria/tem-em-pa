import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AutocompleteRow = {
  id: string;
  name: string;
  slug: string | null;
  neighborhood: string | null;
  logo_url: string | null;
  city_slug: string | null;
  city_name: string | null;
  state: string | null;
};

/** Debounced autocomplete driven by the search_companies_autocomplete RPC. */
export function useAutocomplete(q: string, cityId?: string | null, delay = 180) {
  const [debounced, setDebounced] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), delay);
    return () => clearTimeout(t);
  }, [q, delay]);

  return useQuery({
    queryKey: ["autocomplete", debounced, cityId ?? "all"],
    enabled: debounced.trim().length >= 2,
    staleTime: 30_000,
    queryFn: async (): Promise<AutocompleteRow[]> => {
      const { data, error } = await supabase.rpc("search_companies_autocomplete", {
        q: debounced.trim(),
        _city_id: (cityId ?? null) as unknown as string,
        lim: 8,
      });
      if (error) throw error;
      return (data ?? []) as AutocompleteRow[];
    },
  });
}
