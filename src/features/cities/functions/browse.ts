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

export type StateOption = { uf: string; city_count: number };
export type CityOption = { id: string; slug: string; name: string; state: string };

/** Lista todos os estados (UFs) que possuem ao menos uma cidade ativa. */
export const listStates = createServerFn({ method: "GET" }).handler(
  async (): Promise<StateOption[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("cities")
      .select("state")
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as Array<{ state: string }>) {
      counts.set(row.state, (counts.get(row.state) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([uf, city_count]) => ({ uf, city_count }))
      .sort((a, b) => a.uf.localeCompare(b.uf));
  },
);

/** Lista cidades ativas de uma UF, ordenadas por nome. */
export const listCitiesByState = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ uf: z.string().trim().length(2) }).parse(input),
  )
  .handler(async ({ data }): Promise<CityOption[]> => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("cities")
      .select("id, slug, name, state")
      .eq("is_active", true)
      .eq("state", data.uf.toUpperCase())
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as CityOption[];
  });
