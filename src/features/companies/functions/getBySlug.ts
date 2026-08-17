import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, DETAIL_COLS, normalizeCompany } from "./_client";

/** Fetches an approved company by (citySlug, compSlug) with its products + approved reviews. */
export const getCompanyBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        citySlug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80),
        compSlug: z.string().trim().regex(/^[a-z0-9-]+$/).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: city } = await sb
      .from("cities")
      .select("id")
      .eq("slug", data.citySlug)
      .eq("is_active", true)
      .maybeSingle();
    if (!city) return null;

    const { data: rawCompany, error } = await sb
      .from("companies")
      .select(DETAIL_COLS)
      .eq("city_id", city.id)
      .eq("slug", data.compSlug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!rawCompany) return null;

    const companyId = (rawCompany as unknown as { id: string }).id;
    const [products, reviews] = await Promise.all([
      sb
        .from("products")
        .select("id, name, description, price, image_url_1, image_url_2")
        .eq("company_id", companyId)
        .eq("is_active", true),
      sb
        .from("reviews_public")
        .select("id, rating, comment, created_at, owner_reply, owner_reply_at, photos")
        .eq("company_id", companyId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const company = normalizeCompany(rawCompany as unknown as Record<string, unknown>);
    return {
      ...company,
      products: products.data ?? [],
      reviews: reviews.data ?? [],
    };
  });

/** Server-side lookup that returns just (citySlug, compSlug) for a given company id. */
export const getCompanySlugPathById = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row } = await sb
      .from("companies")
      .select("slug, cities:city_id(slug)")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return null;
    const r = row as unknown as { slug: string | null; cities: { slug: string | null } | null };
    if (!r.slug || !r.cities?.slug) return null;
    return { citySlug: r.cities.slug, compSlug: r.slug };
  });
