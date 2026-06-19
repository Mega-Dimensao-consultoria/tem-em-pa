import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

export type ProductInput = {
  name: string;
  description: string | null;
  price: number | null;
  image_url_1: string | null;
};

export function useProducts(companyId: string) {
  return useQuery({
    queryKey: queryKeys.owner.products(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url_1, is_active")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateProduct(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const { error } = await supabase.from("products").insert({
        company_id: companyId,
        ...input,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto adicionado");
      qc.invalidateQueries({ queryKey: queryKeys.owner.products(companyId) });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
}

export function useDeleteProduct(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: queryKeys.owner.products(companyId) });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
}
