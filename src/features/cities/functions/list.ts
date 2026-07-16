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
  "id, name, slug, state, lat, lng, timezone, is_active, hero_headline, hero_subheadline, search_placeholder, og_image_url, seo_title, seo_description, canonical_url, noindex" as const;

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
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  noindex: boolean | null;
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
  const PAGE = 1000;
  const all: City[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("cities")
      .select(CITY_COLS)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as City[];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
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
