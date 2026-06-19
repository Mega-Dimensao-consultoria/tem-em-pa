import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type PendingClaim = {
  id: string;
  company_id: string;
  user_id: string;
  status: string;
  created_at: string;
  message: string | null;
  document_urls: string[] | null;
  companies: { name: string } | null;
};

export function usePendingClaims() {
  return useQuery({
    queryKey: adminKeys.pendingClaims(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_claims")
        .select(
          "id, company_id, user_id, status, created_at, message, document_urls, companies:company_id(name)",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PendingClaim[];
    },
  });
}

type Decision = "approved" | "rejected";

export function useDecideClaim() {
  return useAdminMutation<{ claim: PendingClaim; status: Decision }>({
    mutationFn: async ({ claim, status }) => {
      const { error } = await supabase
        .from("company_claims")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", claim.id);
      if (error) throw error;
      if (status === "approved") {
        const { error: e2 } = await supabase
          .from("companies")
          .update({ owner_id: claim.user_id, status: "approved" })
          .eq("id", claim.company_id);
        if (e2) {
          // Don't reject the whole mutation — surface a softer error.
          throw new Error("Claim aprovada, mas falhou ao atribuir dono: " + e2.message);
        }
      }
    },
    audit: ({ claim, status }) => ({
      action: status === "approved" ? "claim.approve" : "claim.reject",
      entityType: "claim",
      entityId: claim.id,
      details: { company_id: claim.company_id, user_id: claim.user_id },
    }),
    successMessage: ({ status }) =>
      status === "approved" ? "Reivindicação aprovada" : "Reivindicação rejeitada",
  });
}
