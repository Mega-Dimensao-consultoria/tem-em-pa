import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";

export type MyCompanyRow = {
  id: string;
  name: string;
  status: string;
  is_featured: boolean | null;
  created_at: string;
};

function myCompaniesKey(userId: string | undefined) {
  return ["owner", "my-companies", userId] as const;
}

/** All companies owned by the signed-in user, most recent first. */
export function useMyCompanies() {
  const { user } = useAuth();
  return useQuery({
    queryKey: myCompaniesKey(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<MyCompanyRow[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, status, is_featured, created_at")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MyCompanyRow[];
    },
  });
}

/** Convenience selector — number of companies owned by the signed-in user. */
export function useMyCompaniesCount() {
  const q = useMyCompanies();
  return { ...q, data: q.data?.length ?? 0 };
}
