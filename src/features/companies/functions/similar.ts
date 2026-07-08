import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, CARD_COLS, normalizeCompanies } from "./_client";

export const listSimilarCompanies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        categoryId: z.string().uuid().nullable().optional(),
        neighborhoodId: z.string().uuid().nullable().optional(),
        cityId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    if (!data.categoryId) return [];
    const baseSelect = (CARD_COLS + ", hours") as typeof CARD_COLS;

    let neighborhoodRows: Array<{ id: string }> = [];
    if (data.neighborhoodId) {
      const { data: rows } = await sb
        .from("companies")
        .select(baseSelect)
        .eq("status", "approved")
        .eq("category_id", data.categoryId)
        .eq("neighborhood_id", data.neighborhoodId)
        .neq("id", data.id)
        .limit(6);
      neighborhoodRows = (rows ?? []) as unknown as Array<{ id: string }>;
    }
    if (neighborhoodRows.length >= 6) {
      return normalizeCompanies(neighborhoodRows as unknown as Record<string, unknown>[]);
    }

    const exclude = [data.id, ...neighborhoodRows.map((r) => r.id)];
    let more = sb
      .from("companies")
      .select(baseSelect)
      .eq("status", "approved")
      .eq("category_id", data.categoryId)
      .not("id", "in", `(${exclude.join(",")})`)
      .order("is_featured", { ascending: false })
      .limit(6 - neighborhoodRows.length);
    if (data.cityId) more = more.eq("city_id", data.cityId);
    const { data: moreRows, error } = await more;
    if (error) throw new Error(error.message);
    const combined = [
      ...(neighborhoodRows as unknown as Record<string, unknown>[]),
      ...((moreRows ?? []) as unknown as Record<string, unknown>[]),
    ];
    return normalizeCompanies(combined);
  });
