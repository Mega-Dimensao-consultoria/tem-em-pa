import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type PendingReview = {
  id: string;
  comment: string | null;
  status: string;
  created_at: string;
  rating: number;
  company_id: string;
  companies: { name: string; city_id: string | null; cities: { slug: string | null } | null } | null;
};

export function usePendingReviews() {
  return useQuery({
    queryKey: adminKeys.pendingReviews(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, comment, status, created_at, rating, company_id, companies:company_id(name, city_id, cities:city_id(slug))",
        )
        .in("status", ["pending_moderation", "flagged"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PendingReview[];
    },
  });

}

type Decision = "approved" | "rejected";

export function useDecideReview() {
  return useAdminMutation<{ id: string; status: Decision }>({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, status }) => ({
      action: status === "approved" ? "review.approve" : "review.reject",
      entityType: "review",
      entityId: id,
    }),
    successMessage: ({ status }) =>
      status === "approved" ? "Comentário aprovado" : "Comentário rejeitado",
  });
}
