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

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon, sort_order, seo_title, seo_description, og_image_url, canonical_url, noindex")
        .order("sort_order");
      if (error) throw error;
      return data as AdminCategory[];
    },
  });
}

export function useSaveCategory() {
  return useAdminMutation<CategoryPayload, { id: string }>({
    mutationFn: async ({ id, name, slug, icon, sort_order }) => {
      const payload = { name, slug, icon, sort_order };
      if (id) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        return { id };
      }
      const { data, error } = await supabase
        .from("categories")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id };
    },
    audit: (vars, { id }) => ({
      action: vars.id ? "category.update" : "category.create",
      entityType: "category",
      entityId: id,
      details: {
        name: vars.name,
        slug: vars.slug,
        icon: vars.icon,
        sort_order: vars.sort_order,
      },
    }),
    successMessage: (vars) =>
      vars.id ? "Categoria atualizada" : "Categoria criada",
  });
}

export function useDeleteCategory() {
  return useAdminMutation<{ id: string; name: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, name }) => ({
      action: "category.delete",
      entityType: "category",
      entityId: id,
      details: { name },
    }),
    successMessage: "Categoria excluída",
  });
}
