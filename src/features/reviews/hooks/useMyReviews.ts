import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import { queryKeys } from "@/lib/queryKeys";

export type MyReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  owner_reply: string | null;
  owner_reply_at: string | null;
  company: { id: string; name: string; logo_url: string | null } | null;
};

/** All reviews authored by the signed-in user, most recent first. */
export function useMyReviews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.reviews.mine(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<MyReviewRow[]> => {
      const { data: rows, error } = await supabase.rpc("get_my_reviews");
      if (error) throw error;
      const list = (rows ?? []) as Array<{
        id: string;
        rating: number;
        comment: string | null;
        status: string;
        created_at: string;
        owner_reply: string | null;
        owner_reply_at: string | null;
        company_id: string;
      }>;
      if (list.length === 0) return [];
      const { data: companies, error: cErr } = await supabase
        .from("companies")
        .select("id, name, logo_url")
        .in(
          "id",
          list.map((r) => r.company_id),
        );
      if (cErr) throw cErr;
      const byId = new Map((companies ?? []).map((c) => [c.id, c]));
      return list.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        created_at: r.created_at,
        owner_reply: r.owner_reply,
        owner_reply_at: r.owner_reply_at,
        company: byId.get(r.company_id) ?? null,
      }));
    },
  });
}

function useInvalidateMyReviews() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({ queryKey: queryKeys.reviews.mine(user?.id) });
}

/** Permanently deletes one of the user's own reviews. */
export function useDeleteMyReview() {
  const invalidate = useInvalidateMyReviews();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação excluída.");
      invalidate();
    },
    onError: (e: Error) => toastError(e),
  });
}

type UpdateInput = { id: string; rating: number; comment: string | null };

/** Updates rating/comment of one of the user's own reviews. */
export function useUpdateMyReview() {
  const invalidate = useInvalidateMyReviews();
  return useMutation({
    mutationFn: async ({ id, rating, comment }: UpdateInput) => {
      const { error } = await supabase
        .from("reviews")
        .update({ rating, comment })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        "Avaliação atualizada. Pode passar por moderação novamente.",
      );
      invalidate();
    },
    onError: (e: Error) => toastError(e),
  });
}
