import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, CARD_COLS, normalizeCompanies, type NormalizedCompany } from "./_client";

export type RecentCompaniesResult = {
  companies: NormalizedCompany[];
  total: number;
};

/** Lista empresas aprovadas de uma cidade, ordenadas pela mais recente,
 *  com paginação simples (limit/offset). */
export const listRecentCompaniesByCity = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        cityId: z.string().uuid(),
        limit: z.number().int().min(1).max(60).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<RecentCompaniesResult> => {
    const sb = publicClient();
    const limit = data.limit ?? 15;
    const offset = data.offset ?? 0;
    const { data: rows, error, count } = await sb
      .from("companies")
      .select(CARD_COLS, { count: "exact" })
      .eq("status", "approved")
      .eq("city_id", data.cityId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return {
      companies: normalizeCompanies(rows as unknown as Record<string, unknown>[]),
      total: count ?? 0,
    };
  });
