import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, CARD_COLS, normalizeCompanies } from "./_client";

export const searchCompanies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().trim().max(120).optional(),
        categorySlug: z.string().trim().max(60).optional(),
        cityId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb.from("companies").select(CARD_COLS).eq("status", "approved").limit(40);
    if (data.cityId) query = query.eq("city_id", data.cityId);

    if (data.q && data.q.length > 0) {
      const { data: ftsIds, error: ftsErr } = await sb.rpc("search_companies_autocomplete", {
        q: data.q,
        _city_id: (data.cityId ?? null) as unknown as string,
        lim: 40,
      });
      if (!ftsErr && ftsIds && ftsIds.length > 0) {
        query = query.in(
          "id",
          (ftsIds as Array<{ id: string }>).map((r) => r.id),
        );
      } else {
        query = query.ilike("name", `%${data.q}%`);
      }
    }
    if (data.categorySlug) {
      const { data: cat } = await sb
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (cat?.id) query = query.eq("category_id", cat.id);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return normalizeCompanies(rows as unknown as Record<string, unknown>[]);
  });
