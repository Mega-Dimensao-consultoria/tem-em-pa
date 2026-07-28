import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_GLOBALS, type SeoGlobals } from "@/lib/seo/types";

/** Fetch SEO globals from server side (public read via publishable key). */
export const getSeoGlobals = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await sb
    .from("site_seo_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) return DEFAULT_GLOBALS;
  return normalize(data as Record<string, unknown> | null);
});

function normalize(row: Record<string, unknown> | null): SeoGlobals {
  if (!row) return DEFAULT_GLOBALS;
  const templates =
    (row.templates as SeoGlobals["templates"] | null) ?? DEFAULT_GLOBALS.templates;
  const socials = Array.isArray(row.org_social_urls)
    ? (row.org_social_urls as string[])
    : [];
  return {
    site_name: (row.site_name as string) ?? DEFAULT_GLOBALS.site_name,
    site_tagline: (row.site_tagline as string | null) ?? DEFAULT_GLOBALS.site_tagline,
    title_base: (row.title_base as string) ?? DEFAULT_GLOBALS.title_base,
    title_separator: (row.title_separator as string) ?? DEFAULT_GLOBALS.title_separator,
    default_description:
      (row.default_description as string) ?? DEFAULT_GLOBALS.default_description,
    default_keywords: (row.default_keywords as string | null) ?? DEFAULT_GLOBALS.default_keywords,
    default_og_image_url: (row.default_og_image_url as string | null) ?? null,
    twitter_handle: (row.twitter_handle as string | null) ?? null,
    org_name: (row.org_name as string | null) ?? null,
    org_logo_url: (row.org_logo_url as string | null) ?? null,
    org_social_urls: socials,
    google_site_verification: (row.google_site_verification as string | null) ?? null,
    bing_site_verification: (row.bing_site_verification as string | null) ?? null,
    adsense_enabled: Boolean(row.adsense_enabled ?? false),
    adsense_client_id: (row.adsense_client_id as string | null) ?? null,
    adsense_head_snippet: (row.adsense_head_snippet as string | null) ?? null,
    adsense_body_snippet: (row.adsense_body_snippet as string | null) ?? null,
    templates: {
      company: { ...DEFAULT_GLOBALS.templates.company, ...(templates.company ?? {}) },
      city: { ...DEFAULT_GLOBALS.templates.city, ...(templates.city ?? {}) },
      category: { ...DEFAULT_GLOBALS.templates.category, ...(templates.category ?? {}) },
      event: { ...DEFAULT_GLOBALS.templates.event, ...(templates.event ?? {}) },
    },
  };
}

export const seoGlobalsServerQO = queryOptions({
  queryKey: ["seo", "globals", "server"] as const,
  queryFn: () => getSeoGlobals(),
  staleTime: 5 * 60_000,
});
