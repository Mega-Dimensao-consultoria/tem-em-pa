import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, CARD_COLS } from "./_client";

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
    let query = sb.from("companies").select(CARD_COLS).eq("status", "approved").limit(40);
    if (data.q && data.q.length > 0) {
      query = query.ilike("name", `%${data.q}%`);
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
    return rows ?? [];
  });
