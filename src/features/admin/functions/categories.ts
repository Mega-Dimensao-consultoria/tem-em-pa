import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean | null;
};

export type CategoryPayload = {
  id?: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
};

export function useAdminCategories(type: "company" | "product" = "company") {
  return useQuery({
    queryKey: type === "company" ? adminKeys.categories() : ["admin", "product-categories"],
    queryFn: async () => {
      const query = type === "company" 
        ? supabase.from("categories").select("id, name, slug, icon, sort_order, seo_title, seo_description, og_image_url, canonical_url, noindex")
        : supabase.from("product_categories").select("id, name, slug, sort_order");
      
      const { data, error } = await query.order("sort_order");
      
      if (error) throw error;
      return (data as any) as AdminCategory[];
    },
  });
}

export function useSaveCategory(type: "company" | "product" = "company") {
  return useAdminMutation<CategoryPayload, { id: string }>({
    mutationFn: async ({ id, name, slug, icon, sort_order }) => {
      const payload: any = { name, slug, sort_order };
      if (type === "company") payload.icon = icon;

      if (id) {
        const { error } = await (supabase.from(type === "company" ? "categories" : "product_categories") as any)
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        return { id };
      }
      
      const { data, error } = await (supabase.from(type === "company" ? "categories" : "product_categories") as any)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return { id: (data as any).id };
    },
    audit: (vars, { id }) => ({
      action: vars.id ? `${type}_category.update` : `${type}_category.create`,
      entityType: `${type}_category`,
      entityId: id,
      details: {
        name: vars.name,
        slug: vars.slug,
        sort_order: vars.sort_order,
      },
    }),
    successMessage: (vars) =>
      vars.id ? "Categoria atualizada" : "Categoria criada",
  });
}

export function useDeleteCategory(type: "company" | "product" = "company") {
  return useAdminMutation<{ id: string; name: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await (supabase.from(type === "company" ? "categories" : "product_categories") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, name }) => ({
      action: `${type}_category.delete`,
      entityType: `${type}_category`,
      entityId: id,
      details: { name },
    }),
    successMessage: "Categoria excluída",
  });
}
