import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Server-only publishable Supabase client for public Data API reads. */
export function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/** Colunas para o card (lista/busca). Traz joins de city e neighborhood. */
export const CARD_COLS =
  "id, name, slug, description, city_id, neighborhood_id, logo_url, cover_url, is_featured, category_id, categories:category_id(name, slug, icon), cities:city_id(name, slug, state), neighborhoods:neighborhood_id(name, slug)" as const;

/** Colunas para a página de detalhe. */
export const DETAIL_COLS =
  "id, name, slug, description, cep, address, number, complement, city_id, neighborhood_id, lat, lng, phone, whatsapp, email, website, instagram_url, facebook_url, hours, gallery_urls, logo_url, cover_url, status, owner_id, is_featured, category_id, seo_title, seo_description, og_image_url, canonical_url, noindex, categories:category_id(name, slug, icon), cities:city_id(name, slug, state), neighborhoods:neighborhood_id(name, slug)" as const;

type JsonPrimitive = string | number | boolean | null;
type Json = JsonPrimitive | Json[] | { [key: string]: Json };

/** Shape plano usado pelos componentes de card / detalhe.
 * Todos os campos são JSON-serializáveis para atravessar o RPC de server fn. */
export type NormalizedCompany = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  city_id: string | null;
  neighborhood_id: string | null;
  state: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean | null;
  category_id: string | null;
  status?: string | null;
  owner_id?: string | null;
  address?: string | null;
  number?: string | null;
  complement?: string | null;
  cep?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  hours?: Json;
  gallery_urls?: string[] | null;
  categories: { name: string | null; slug: string | null; icon: string | null } | null;
  city: string | null;
  city_slug: string | null;
  neighborhood: string | null;
  neighborhood_slug: string | null;
};

type RawJoinRow = {
  cities?: { name: string | null; slug: string | null; state: string | null } | null;
  neighborhoods?: { name: string | null; slug: string | null } | null;
  [key: string]: unknown;
};

export function normalizeCompany(row: unknown): NormalizedCompany {
  const r = row as RawJoinRow;
  const base = { ...(r as unknown as Record<string, unknown>) };
  delete base.cities;
  delete base.neighborhoods;
  return {
    ...(base as unknown as NormalizedCompany),
    city: r.cities?.name ?? null,
    city_slug: r.cities?.slug ?? null,
    neighborhood: r.neighborhoods?.name ?? null,
    neighborhood_slug: r.neighborhoods?.slug ?? null,
    state: r.cities?.state ?? null,
    categories: (r as { categories?: NormalizedCompany["categories"] }).categories ?? null,
  };
}

export function normalizeCompanies(rows: unknown): NormalizedCompany[] {
  return ((rows as unknown[]) ?? []).map((r) => normalizeCompany(r));
}
