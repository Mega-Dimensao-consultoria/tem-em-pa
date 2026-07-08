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
