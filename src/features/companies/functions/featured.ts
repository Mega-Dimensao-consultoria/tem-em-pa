import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, CARD_COLS, normalizeCompanies } from "./_client";

export const listFeaturedCompanies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ cityId: z.string().uuid().nullable().optional() }).optional().parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb
      .from("companies")
      .select(CARD_COLS)
      .eq("status", "approved")
      .eq("is_featured", true)
      .limit(8);
    if (data?.cityId) query = query.eq("city_id", data.cityId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return normalizeCompanies(rows as unknown as Record<string, unknown>[]);
  });

export type PromotedCompany = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean | null;
  city_id: string | null;
  neighborhood_id: string | null;
  category_id: string | null;
  city_name: string | null;
  city_slug: string | null;
  neighborhood_name: string | null;
  neighborhood_slug: string | null;
  category_name: string | null;
  promotion_ends_at: string | null;
};

export const listPromotedCompanies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({
      cityId: z.string().uuid().nullable().optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }).optional().parse(input),
  )
  .handler(async ({ data }): Promise<PromotedCompany[]> => {
    const sb = publicClient();
    const { data: rows, error } = await sb.rpc("list_promoted_companies", {
      _city_id: data?.cityId ?? null,
      _limit: data?.limit ?? 10,
    });
    if (error) throw new Error(error.message);
    return ((rows as unknown as PromotedCompany[]) ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      logo_url: r.logo_url,
      cover_url: r.cover_url,
      is_featured: r.is_featured,
      city_id: r.city_id,
      neighborhood_id: r.neighborhood_id,
      category_id: r.category_id,
      city_name: r.city_name,
      city_slug: r.city_slug,
      neighborhood_name: r.neighborhood_name,
      neighborhood_slug: r.neighborhood_slug,
      category_name: r.category_name,
      promotion_ends_at: r.promotion_ends_at,
    }));
  });
