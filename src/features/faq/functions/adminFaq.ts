import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/safe";

export type FaqCategory = "moradores" | "empresas";

export type AdminFaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const KEY = ["admin", "faq"] as const;

export function useAdminFaqItems() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AdminFaqItem[]> => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("id, category, question, answer, sort_order, is_active")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminFaqItem[];
    },
  });
}

function useFaqMutation<TVars>(
  fn: (vars: TVars) => Promise<void>,
  message: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(message);
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["faq", "public"] });
    },
    onError: (e: unknown) => toastError(e, "Falha ao salvar pergunta"),
  });
}

export type FaqInput = {
  id?: string;
  category: FaqCategory;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

export function useSaveFaqItem() {
  return useFaqMutation<FaqInput>(async ({ id, ...rest }) => {
    if (id) {
      const { error } = await supabase.from("faq_items").update(rest as never).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("faq_items").insert(rest as never);
      if (error) throw error;
    }
  }, "Pergunta salva");
}

export function useDeleteFaqItem() {
  return useFaqMutation<{ id: string }>(async ({ id }) => {
    const { error } = await supabase.from("faq_items").delete().eq("id", id);
    if (error) throw error;
  }, "Pergunta removida");
}
