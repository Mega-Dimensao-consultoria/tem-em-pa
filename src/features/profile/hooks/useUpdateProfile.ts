import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import { queryKeys } from "@/lib/queryKeys";

type Input = {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

/**
 * Mutation that updates the signed-in user's profile row and invalidates the
 * cached profile so consumers (Header avatar, settings page) re-fetch.
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Input) => {
      if (!user) throw new Error("Sessão expirada");
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: queryKeys.profile.me(user.id) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao salvar"),
  });
}
