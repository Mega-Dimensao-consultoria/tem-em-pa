import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const SITEMAP_BASE_URL = "https://www.temnaminhacidade.com.br";
// 10k URLs por sub-sitemap: bem dentro do limite de 50k do protocolo e
// leve o suficiente para caber no CPU/memória do Worker sem estourar
// (evita "connection reset by peer" em picos de crawler).
export const SITEMAP_PAGE_SIZE = 10000;
/** Cidades por página em /sitemap-cities/$page — 2000 × ~16 URLs/cidade ≈ 32k URLs. */
export const CITIES_PER_SITEMAP_PAGE = 2000;

export type SitemapEntry = {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
};

export function sitemapClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export function renderSitemap(entries: SitemapEntry[]): Response {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${SITEMAP_BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export function renderSitemapIndex(children: { path: string }[]): Response {
  const items = children.map(
    (c) => `  <sitemap>\n    <loc>${SITEMAP_BASE_URL}${c.path}</loc>\n  </sitemap>`,
  );
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items,
    `</sitemapindex>`,
  ].join("\n");
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** Fetches every row of a table in chunks of 1000 (PostgREST default cap). */
export async function fetchAll<T>(
  build: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
  chunk = 1000,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  // Cap absurdly high at ~1M rows to avoid infinite loops.
  for (let i = 0; i < 1000; i += 1) {
    const to = from + chunk - 1;
    const { data, error } = await build(from, to);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < chunk) break;
    from += chunk;
  }
  return out;
}

/** Returns counts + city slugs that host at least one approved+indexable company. */
export async function getSitemapCounts() {
  const sb = sitemapClient();

  const [companiesHead, hoodsHead, productsHead, activeCities] = await Promise.all([
    sb
      .from("companies")
      .select("id", { count: "estimated", head: true })
      .eq("status", "approved")
      .or("noindex.is.null,noindex.eq.false"),
    sb
      .from("neighborhoods")
      .select("id", { count: "estimated", head: true })
      .eq("is_active", true),
    sb
      .from("products")
      .select("id", { count: "estimated", head: true })
      .eq("is_active", true),
    fetchAll<{ id: string; slug: string | null; noindex: boolean | null }>(
      async (from, to) => {
        const res = await sb
          .from("cities")
          .select("id, slug, noindex")
          .eq("is_active", true)
          .order("id", { ascending: true })
          .range(from, to);
        return { data: res.data, error: res.error };
      },
    ),
  ]);

  const activeSlugsById = new Map<string, string>();
  for (const c of activeCities) {
    if (c.slug && !c.noindex) activeSlugsById.set(c.id, c.slug);
  }

  return {
    companyCount: companiesHead.count ?? 0,
    neighborhoodCount: hoodsHead.count ?? 0,
    productCount: productsHead.count ?? 0,
    cityCount: activeSlugsById.size,
    activeSlugsById,
  };
}
