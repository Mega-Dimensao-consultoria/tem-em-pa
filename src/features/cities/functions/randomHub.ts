import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type HubCity = {
  id: string;
  name: string;
  slug: string;
  state: string;
  hero_headline: string | null;
  hero_subheadline: string | null;
  og_image_url: string | null;
  company_count: number;
};

/** Returns active cities in random order with an approved-company count. */
export const listHubCities = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(60).optional() }).optional().parse(input),
  )
  .handler(async ({ data }): Promise<HubCity[]> => {
    const sb = publicClient();
    const { data: cities, error } = await sb
      .from("cities")
      .select("id, name, slug, state, hero_headline, hero_subheadline, og_image_url")
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    const rows = (cities ?? []) as Array<Omit<HubCity, "company_count">>;

    const counts = await Promise.all(
      rows.map(async (c) => {
        const { count } = await sb
          .from("companies")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("city_id", c.id);
        return { id: c.id, count: count ?? 0 };
      }),
    );
    const countById = new Map(counts.map((x) => [x.id, x.count]));

    const shuffled = [...rows].sort(() => Math.random() - 0.5);
    const limit = data?.limit ?? shuffled.length;
    return shuffled.slice(0, limit).map((c) => ({
      ...c,
      company_count: countById.get(c.id) ?? 0,
    }));
  });
