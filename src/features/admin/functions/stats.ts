import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";

export type AdminStats = {
  companiesPending: number;
  companiesApproved: number;
  claimsPending: number;
  reviewsPending: number;
  reportsPending: number;
  users: number;
};

async function fetchAdminStats(): Promise<AdminStats> {
  const head = { count: "exact" as const, head: true };
  const [
    companiesPending,
    companiesApproved,
    claimsPending,
    reviewsPending,
    reportsPending,
    users,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id", head)
      .in("status", ["pending", "claimed_pending"]),
    supabase.from("companies").select("id", head).eq("status", "approved"),
    supabase.from("company_claims").select("id", head).eq("status", "pending"),
    supabase
      .from("reviews")
      .select("id", head)
      .in("status", ["pending_moderation", "flagged"]),
    supabase.from("review_reports").select("id", head).eq("status", "pending"),
    supabase.from("profiles").select("id", head),
  ]);
  return {
    companiesPending: companiesPending.count ?? 0,
    companiesApproved: companiesApproved.count ?? 0,
    claimsPending: claimsPending.count ?? 0,
    reviewsPending: reviewsPending.count ?? 0,
    reportsPending: reportsPending.count ?? 0,
    users: users.count ?? 0,
  };
}

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats(), queryFn: fetchAdminStats });
}
