import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getAdminProducts = createServerFn({ method: "GET" })
  .inputValidator((data) => 
    z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
      status: z.enum(["all", "active", "inactive"]).default("all"),
      categoryId: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("products")
      .select(`
        *,
        company:companies(id, name, status),
        product_category:product_categories(id, name)
      `, { count: "exact" });

    if (data.search) {
      query = query.ilike("name", `%${data.search}%`);
    }
    if (data.status === "active") {
      query = query.eq("is_active", true);
    } else if (data.status === "inactive") {
      query = query.eq("is_active", false);
    }
    if (data.categoryId) {
      query = query.eq("product_category_id", data.categoryId);
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    const { data: rows, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      rows: rows || [],
      total: count || 0,
    };
  });

export const updateProductAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => 
    z.object({
      id: z.string(),
      updates: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional().nullable(),
        is_active: z.boolean().optional(),
        is_promoted: z.boolean().optional(),
        product_category_id: z.string().optional().nullable(),
      })
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("products")
      .update(data.updates)
      .eq("id", data.id);

    if (error) throw error;
    return { success: true };
  });

export const toggleCompanyProducts = createServerFn({ method: "POST" })
  .inputValidator((data) => 
    z.object({
      companyId: z.string(),
      isActive: z.boolean(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: data.isActive })
      .eq("company_id", data.companyId);

    if (error) throw error;
    return { success: true };
  });

export const getProductCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  });

export const saveProductCategory = createServerFn({ method: "POST" })
  .inputValidator((data) => 
    z.object({
      id: z.string().optional(),
      name: z.string(),
      slug: z.string(),
      sort_order: z.number().default(0),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    if (data.id) {
      const { error } = await supabase
        .from("product_categories")
        .update({ name: data.name, slug: data.slug, sort_order: data.sort_order })
        .eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("product_categories")
        .insert({ name: data.name, slug: data.slug, sort_order: data.sort_order });
      if (error) throw error;
    }
    return { success: true };
  });

export const deleteProductCategory = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });
