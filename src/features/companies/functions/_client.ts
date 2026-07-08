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
  "id, name, slug, description, city_id, neighborhood_id, state, logo_url, cover_url, is_featured, category_id, categories:category_id(name, slug, icon), cities:city_id(name, slug, state), neighborhoods:neighborhood_id(name, slug)" as const;

/** Colunas para a página de detalhe. */
export const DETAIL_COLS =
  "id, name, slug, description, cep, address, number, complement, city_id, neighborhood_id, state, lat, lng, website, instagram_url, facebook_url, hours, gallery_urls, logo_url, cover_url, status, owner_id, is_featured, category_id, categories:category_id(name, slug, icon), cities:city_id(name, slug, state), neighborhoods:neighborhood_id(name, slug)" as const;

/**
 * Row de empresa retornado pelo Data API com joins.
 * `cities` e `neighborhoods` são objetos aninhados (ou null).
 */
type RawCompanyRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  city_id: string | null;
  neighborhood_id: string | null;
  state?: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean | null;
  category_id: string | null;
  categories: { name: string | null; slug: string | null; icon: string | null } | null;
  cities: { name: string | null; slug: string | null; state: string | null } | null;
  neighborhoods: { name: string | null; slug: string | null } | null;
  [key: string]: unknown;
};

/**
 * Normaliza um row de empresa retornado do Supabase (com joins) para o shape
 * plano que os componentes esperam: adiciona `city`, `neighborhood`,
 * `city_slug` e `neighborhood_slug` como campos derivados dos joins,
 * preservando os demais campos.
 */
export function normalizeCompany<T extends Partial<RawCompanyRow>>(row: T) {
  const cities = (row as RawCompanyRow).cities ?? null;
  const neighborhoods = (row as RawCompanyRow).neighborhoods ?? null;
  return {
    ...(row as T),
    city: cities?.name ?? null,
    city_slug: cities?.slug ?? null,
    neighborhood: neighborhoods?.name ?? null,
    neighborhood_slug: neighborhoods?.slug ?? null,
    state: (row as RawCompanyRow).state ?? cities?.state ?? null,
  };
}

export function normalizeCompanies<T extends Partial<RawCompanyRow>>(rows: T[] | null | undefined) {
  return (rows ?? []).map((r) => normalizeCompany(r));
}
