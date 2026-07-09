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
    const { data, error } = await (sb.rpc as unknown as (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>)("list_active_states");
    if (error) throw new Error(error.message);
    return ((data ?? []) as Array<{ uf: string; city_count: number }>).map((r) => ({
      uf: r.uf,
      city_count: Number(r.city_count),
    }));
  },
);

/** Lista cidades ativas de uma UF, ordenadas por nome. */
export const listCitiesByState = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ uf: z.string().trim().length(2) }).parse(input),
  )
  .handler(async ({ data }): Promise<CityOption[]> => {
    const sb = publicClient();
    const { data: rows, error } = await sb.rpc("list_active_cities_by_state", {
      _uf: data.uf.toUpperCase(),
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as CityOption[];
  });
