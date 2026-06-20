import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import { queryKeys } from "@/lib/queryKeys";

export type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

/** Loads the signed-in user's profile row. */
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile.me(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
