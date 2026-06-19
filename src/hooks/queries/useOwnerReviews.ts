import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

export type OwnerReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  status: string;
  owner_reply: string | null;
  owner_reply_at: string | null;
};

export function useOwnerReviews(id: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.owner.reviews(id),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, rating, comment, created_at, status, owner_reply, owner_reply_at",
        )
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as OwnerReview[];
    },
  });
}
