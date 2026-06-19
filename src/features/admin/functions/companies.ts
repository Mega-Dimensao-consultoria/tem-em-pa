import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type PendingCompany = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  status: string;
  created_at: string;
};

export function usePendingCompanies() {
  return useQuery({
    queryKey: adminKeys.pendingCompanies(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, description, city, status, created_at")
        .in("status", ["pending", "claimed_pending"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PendingCompany[];
    },
  });
}

type Decision = "approved" | "rejected";

export function useDecideCompany() {
  return useAdminMutation<{ id: string; name: string; status: Decision }>({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from("companies")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, name, status }) => ({
      action: status === "approved" ? "company.approve" : "company.reject",
      entityType: "company",
      entityId: id,
      details: { name },
    }),
    successMessage: ({ status }) =>
      status === "approved" ? "Empresa aprovada" : "Empresa rejeitada",
  });
}
