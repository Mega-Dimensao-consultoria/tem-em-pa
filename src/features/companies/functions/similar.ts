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
    if (!data.categoryId) return [];
    const baseSelect = (CARD_COLS + ", hours") as typeof CARD_COLS;
    type Row = Awaited<
      ReturnType<ReturnType<typeof publicClient>["from"] extends (t: "companies") => infer Q ? Q : never>
    >;
    void (null as unknown as Row); // keep TS happy with type-only reference
    let neighborhoodRows: Array<{ id: string }> = [];
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
