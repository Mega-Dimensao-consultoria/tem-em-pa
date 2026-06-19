import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";
import type { EventRow } from "@/lib/owner/metrics";

export function useCompanyEvents(id: string, periodDays: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.owner.events(id, periodDays),
    enabled,
    queryFn: async () => {
      const since = new Date(
        Date.now() - periodDays * 2 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await supabase
        .from("company_events")
        .select("event_type, created_at")
        .eq("company_id", id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return data as EventRow[];
    },
  });
}
