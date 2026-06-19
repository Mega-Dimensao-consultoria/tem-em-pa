import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type ReportFilter = "pending" | "resolved" | "all";

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Spam / propaganda",
  offensive: "Linguagem ofensiva",
  fake: "Avaliação falsa",
  personal_info: "Dados pessoais",
  other: "Outro motivo",
};

export function useReviewReports(filter: ReportFilter) {
  return useQuery({
    queryKey: adminKeys.reports(filter),
    queryFn: async () => {
      let q = supabase
        .from("review_reports")
        .select(
          "id, review_id, reporter_id, reason, details, status, created_at, resolved_at, reviews:review_id(id, rating, comment, status, company_id, companies:company_id(id, name))",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

type ResolveAction = "dismiss" | "remove_review";

export function useResolveReport() {
  const { user } = useAuth();
  return useAdminMutation<{ id: string; action: ResolveAction; reviewId: string }>({
    mutationFn: async ({ id, action, reviewId }) => {
      if (!user) throw new Error("Sem sessão");
      if (action === "remove_review") {
        const { error } = await supabase
          .from("reviews")
          .delete()
          .eq("id", reviewId);
        if (error) throw error;
      }
      const { error } = await supabase
        .from("review_reports")
        .update({
          status: action === "remove_review" ? "removed" : "dismissed",
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, action }) => ({
      action: `report.${action}`,
      entityType: "review_reports",
      entityId: id,
    }),
    successMessage: ({ action }) =>
      action === "remove_review"
        ? "Avaliação removida e denúncia resolvida."
        : "Denúncia descartada.",
    invalidate: [adminKeys.reportsRoot()],
  });
}
