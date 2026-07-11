import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/safe";
import { DEFAULT_GLOBALS, type SeoGlobals } from "@/lib/seo/types";

const KEY = ["seo", "globals"] as const;

function normalize(row: Record<string, unknown> | null | undefined): SeoGlobals {
  if (!row) return DEFAULT_GLOBALS;
  const templates =
    (row.templates as SeoGlobals["templates"] | null) ?? DEFAULT_GLOBALS.templates;
  const socials = Array.isArray(row.org_social_urls)
    ? (row.org_social_urls as string[])
    : [];
  return {
    site_name: (row.site_name as string) ?? DEFAULT_GLOBALS.site_name,
    title_base: (row.title_base as string) ?? DEFAULT_GLOBALS.title_base,
    title_separator: (row.title_separator as string) ?? DEFAULT_GLOBALS.title_separator,
    default_description:
      (row.default_description as string) ?? DEFAULT_GLOBALS.default_description,
    default_og_image_url: (row.default_og_image_url as string | null) ?? null,
    twitter_handle: (row.twitter_handle as string | null) ?? null,
    org_name: (row.org_name as string | null) ?? null,
    org_logo_url: (row.org_logo_url as string | null) ?? null,
    org_social_urls: socials,
    google_site_verification: (row.google_site_verification as string | null) ?? null,
    bing_site_verification: (row.bing_site_verification as string | null) ?? null,
    templates: {
      company: { ...DEFAULT_GLOBALS.templates.company, ...(templates.company ?? {}) },
      city: { ...DEFAULT_GLOBALS.templates.city, ...(templates.city ?? {}) },
      category: { ...DEFAULT_GLOBALS.templates.category, ...(templates.category ?? {}) },
      event: { ...DEFAULT_GLOBALS.templates.event, ...(templates.event ?? {}) },
    },
  };
}

async function fetchGlobals(): Promise<SeoGlobals> {
  const { data, error } = await supabase
    .from("site_seo_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return normalize(data as Record<string, unknown> | null);
}

export const seoGlobalsQO = queryOptions({
  queryKey: KEY,
  queryFn: fetchGlobals,
  staleTime: 5 * 60_000,
});

export function useSeoGlobals() {
  return useQuery(seoGlobalsQO);
}

export function useUpdateSeoGlobals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<SeoGlobals>) => {
      const { error } = await supabase
        .from("site_seo_settings")
        .update(patch as never)
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("SEO atualizado");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toastError(e),
  });
}
