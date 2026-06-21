import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import { adminResetUserMfa } from "@/lib/twofa.functions";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type AdminUser = {
  id: string;
  full_name: string | null;
  is_banned: boolean;
  created_at: string;
  is_admin: boolean;
};

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: async (): Promise<AdminUser[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, is_banned, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = profiles.map((p) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      const adminSet = new Set(
        (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
      );
      return profiles.map((p) => ({ ...p, is_admin: adminSet.has(p.id) }));
    },
  });
}

export function useToggleBan() {
  return useAdminMutation<{ id: string; banned: boolean; name: string | null }>({
    mutationFn: async ({ id, banned }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !banned })
        .eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, banned, name }) => ({
      action: banned ? "user.unban" : "user.ban",
      entityType: "user",
      entityId: id,
      details: { name },
    }),
    successMessage: ({ banned }) =>
      !banned ? "Usuário banido" : "Banimento removido",
  });
}

export function usePromoteAdmin() {
  return useAdminMutation<{ id: string; name: string | null }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: id, role: "admin" });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    audit: ({ id, name }) => ({
      action: "user.promote_admin",
      entityType: "user",
      entityId: id,
      details: { name },
    }),
    successMessage: "Usuário promovido a administrador",
  });
}

export function useDemoteAdmin() {
  const { user } = useAuth();
  return useAdminMutation<{ id: string; name: string | null }>({
    mutationFn: async ({ id }) => {
      if (user && id === user.id) {
        throw new Error("Você não pode remover o seu próprio acesso admin.");
      }
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", id)
        .eq("role", "admin");
      if (error) throw error;
    },
    audit: ({ id, name }) => ({
      action: "user.demote_admin",
      entityType: "user",
      entityId: id,
      details: { name },
    }),
    successMessage: "Acesso admin removido",
  });
}

export function useAdminResetUserMfa() {
  return useAdminMutation<{ id: string; name: string | null }, { removed: number }>({
    mutationFn: async ({ id }) => adminResetUserMfa({ data: { userId: id } }),
    audit: ({ id, name }, data) => ({
      action: "user.reset_mfa",
      entityType: "user",
      entityId: id,
      details: { name, factors_removed: data.removed },
    }),
    successMessage: (_v, data) =>
      data.removed > 0
        ? `2FA removido (${data.removed} fator(es)).`
        : "Esse usuário não tinha 2FA configurado.",
  });
}
