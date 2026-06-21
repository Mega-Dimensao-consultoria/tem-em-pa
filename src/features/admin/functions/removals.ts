import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type PendingRemoval = {
  id: string;
  company_id: string;
  user_id: string;
  reason: "closed" | "incorrect" | "duplicate" | "owner_request" | "other";
  details: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  companies: { name: string } | null;
};

export const REMOVAL_REASON_LABEL: Record<PendingRemoval["reason"], string> = {
  closed: "Empresa fechou",
  incorrect: "Informações incorretas",
  duplicate: "Cadastro duplicado",
  owner_request: "Pedido do dono",
  other: "Outro motivo",
};

export function usePendingRemovals() {
  return useQuery({
    queryKey: adminKeys.pendingRemovals(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_removal_requests")
        .select(
          "id, company_id, user_id, reason, details, status, created_at, companies:company_id(name)",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PendingRemoval[];
    },
  });
}

type Decision = "approved" | "rejected";

export function useDecideRemoval() {
  return useAdminMutation<{ removal: PendingRemoval; status: Decision }>({
    mutationFn: async ({ removal, status }) => {
      const { error } = await supabase
        .from("company_removal_requests")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", removal.id);
      if (error) throw error;
    },
    audit: ({ removal, status }) => ({
      action: status === "approved" ? "removal.approve" : "removal.reject",
      entityType: "company_removal_request",
      entityId: removal.id,
      details: { company_id: removal.company_id, reason: removal.reason },
    }),
    successMessage: ({ status }) =>
      status === "approved"
        ? "Remoção aprovada — empresa ocultada"
        : "Solicitação de remoção rejeitada",
  });
}
