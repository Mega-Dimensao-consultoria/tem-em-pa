import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, CARD_COLS } from "./_client";

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
    if (!data.categoryId) return [] as any[];
    const baseSelect = CARD_COLS + ", hours";
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
      neighborhoodRows = (rows as any[]) ?? [];
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
    return [...neighborhoodRows, ...((more as any[]) ?? [])];
  });
