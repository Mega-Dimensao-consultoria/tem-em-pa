import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const SELECT_COLS =
  "id, name, slug, description, neighborhood, city, state, logo_url, cover_url, is_featured, category_id, categories:category_id(name, slug, icon)";

export const listFeaturedCompanies = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("companies")
    .select(SELECT_COLS)
    .eq("status", "approved")
    .eq("is_featured", true)
    .limit(8);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const searchCompanies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().trim().max(120).optional(),
        categorySlug: z.string().trim().max(60).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb.from("companies").select(SELECT_COLS).eq("status", "approved").limit(40);
    if (data.q && data.q.length > 0) {
      query = query.ilike("name", `%${data.q}%`);
    }
    if (data.categorySlug) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      if (cat?.id) query = query.eq("category_id", cat.id);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getCompanyById = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: company, error } = await sb
      .from("companies")
      .select(
        "id, name, description, cep, address, number, complement, neighborhood, city, state, lat, lng, phone, whatsapp, email, website, instagram_url, facebook_url, hours, gallery_urls, logo_url, cover_url, status, owner_id, is_featured, category_id, categories:category_id(name, slug, icon)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!company) return null;

    const [products, reviews] = await Promise.all([
      sb
        .from("products")
        .select("id, name, description, price, image_url_1, image_url_2")
        .eq("company_id", data.id)
        .eq("is_active", true),
      sb
        .from("reviews")
        .select("id, rating, comment, created_at, owner_reply, owner_reply_at")
        .eq("company_id", data.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      ...company,
      products: products.data ?? [],
      reviews: reviews.data ?? [],
    };
  });

export const listSimilarCompanies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        categoryId: z.string().uuid().nullable().optional(),
        neighborhood: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    if (!data.categoryId) return [];
    // Prefer same neighborhood first
    const baseSelect = SELECT_COLS + ", hours";
    let neighborhoodRows: any[] = [];
    if (data.neighborhood) {
      const { data: rows } = await sb
        .from("companies")
        .select(baseSelect)
        .eq("status", "approved")
        .eq("category_id", data.categoryId)
        .eq("neighborhood", data.neighborhood)
        .neq("id", data.id)
        .limit(6);
      neighborhoodRows = rows ?? [];
    }
    if (neighborhoodRows.length >= 6) return neighborhoodRows;
    const exclude = [data.id, ...neighborhoodRows.map((r) => r.id)];
    const { data: more, error } = await sb
      .from("companies")
      .select(baseSelect)
      .eq("status", "approved")
      .eq("category_id", data.categoryId)
      .not("id", "in", `(${exclude.join(",")})`)
      .order("is_featured", { ascending: false })
      .limit(6 - neighborhoodRows.length);
    if (error) throw new Error(error.message);
    return [...neighborhoodRows, ...(more ?? [])];
  });

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().trim().max(60) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: cat, error } = await sb
      .from("categories")
      .select("id, name, slug, icon")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return cat;
  });
