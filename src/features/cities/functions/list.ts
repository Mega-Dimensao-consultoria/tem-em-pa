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

const CITY_COLS =
  "id, name, slug, state, lat, lng, timezone, is_active, hero_headline, hero_subheadline, search_placeholder, og_image_url" as const;

export type City = {
  id: string;
  name: string;
  slug: string;
  state: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  is_active: boolean;
  hero_headline: string | null;
  hero_subheadline: string | null;
  search_placeholder: string | null;
  og_image_url: string | null;
};

export type Neighborhood = {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export const listActiveCities = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("cities")
    .select(CITY_COLS)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as City[];
});

export const getCityBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().trim().regex(/^[a-z0-9-]+$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: city, error } = await sb
      .from("cities")
      .select(CITY_COLS)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (city ?? null) as City | null;
  });

export const listNeighborhoodsByCity = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ cityId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("neighborhoods")
      .select("id, city_id, name, slug, is_active")
      .eq("city_id", data.cityId)
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Neighborhood[];
  });

export const getNeighborhoodBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        cityId: z.string().uuid(),
        slug: z.string().trim().regex(/^[a-z0-9-]+$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("neighborhoods")
      .select("id, city_id, name, slug, is_active")
      .eq("city_id", data.cityId)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as Neighborhood | null;
  });
