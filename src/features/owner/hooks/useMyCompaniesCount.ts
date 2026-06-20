import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";

/** Returns the number of companies owned by the signed-in user (0 when none). */
export function useMyCompaniesCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-companies-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("companies")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
