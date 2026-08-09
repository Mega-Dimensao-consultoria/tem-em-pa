import type {
  SchemaType,
  SeoGlobals,
  SeoOverride,
  SeoTemplateKind,
  SeoTemplateVars,
} from "./types";
import { DEFAULT_GLOBALS } from "./types";

const SITE_URL = "https://www.temnaminhacidade.com.br";

/** Substitui `{{var}}` por valores; variáveis vazias/nulas viram string vazia. */
export function renderTemplate(tpl: string, vars: SeoTemplateVars): string {
  return tpl
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => {
      const v = vars[k];
      return v == null ? "" : String(v);
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Cai em fallback quando o override é nulo/vazio. */
export function coalesce<T>(...values: Array<T | null | undefined | "">): T | undefined {
  for (const v of values) {
    if (v != null && v !== "") return v as T;
  }
  return undefined;
}

export type ResolvedSeo = {
  title: string;
  description: string;
  keywords: string | null;
  schemaType: SchemaType | string | null;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | undefined;
  canonical: string;
  noindex: boolean;
  siteName: string;
  twitterHandle: string | null;
};

export type ResolveArgs = {
  url: string;
  fallbackTitle: string;
  fallbackDescription?: string;
  fallbackKeywords?: string;
  fallbackSchemaType?: SchemaType | string;
  override?: SeoOverride | null;
  templateKind?: SeoTemplateKind;
  templateVars?: SeoTemplateVars;
  globals?: SeoGlobals | null;
};

/**
 * Ordem de resolução: override manual > template preenchido > fallback dado
 * pela rota > padrão global. `canonical` = override.canonical_url ou a própria URL.
 */
export function resolveSeo(args: ResolveArgs): ResolvedSeo {
  const g = args.globals ?? DEFAULT_GLOBALS;
  const tpl = args.templateKind ? g.templates[args.templateKind] : null;

  const vars: SeoTemplateVars = {
    siteName: g.site_name,
    ...(args.templateVars ?? {}),
  };

  const tplTitle = tpl?.title ? renderTemplate(tpl.title, vars) : "";
  const tplDesc = tpl?.description ? renderTemplate(tpl.description, vars) : "";

  const title =
    coalesce(args.override?.seo_title, tplTitle, args.fallbackTitle) ?? g.title_base;
  const description =
    coalesce(
      args.override?.seo_description,
      tplDesc,
      args.fallbackDescription,
      g.default_description,
    ) ?? "";

  const keywords =
    coalesce(
      args.override?.seo_keywords,
      args.fallbackKeywords,
      g.default_keywords ?? undefined,
    ) ?? null;

  return {
    title,
    description,
    keywords,
    schemaType:
      coalesce(args.override?.schema_type, args.fallbackSchemaType) ?? null,
    ogTitle: coalesce(args.override?.og_title, title) ?? title,
    ogDescription: coalesce(args.override?.og_description, description) ?? description,
    ogImage:
      coalesce(
        args.override?.og_image_url,
        tpl?.og_image_url ?? undefined,
        g.default_og_image_url ?? undefined,
      ) ?? undefined,
    canonical: coalesce(args.override?.canonical_url, args.url) ?? args.url,
    noindex: !!args.override?.noindex,
    siteName: g.site_name,
    twitterHandle: g.twitter_handle,
  };
}

type MetaEntry = Record<string, string>;
type ScriptEntry = { type: string; children: string };

/**
 * Monta o array `meta` + `links` + `scripts` no formato aceito pelo `head()`.
 * Se `seo.schemaType` estiver preenchido, emite JSON-LD básico. Rotas podem
 * passar `extraSchema` para acrescentar campos específicos.
 */
export function buildSeoHead(input: {
  seo: ResolvedSeo;
  ogType?: "website" | "article" | "product" | "profile";
  /** Merge de campos extras no JSON-LD (ex.: author/datePublished p/ BlogPosting). */
  extraSchema?: Record<string, unknown>;
}): { meta: MetaEntry[]; links: MetaEntry[]; scripts: ScriptEntry[] } {
  const { seo, ogType = "website", extraSchema } = input;
  const meta: MetaEntry[] = [
    { title: seo.title },
    { name: "description", content: seo.description },
    { property: "og:title", content: seo.ogTitle },
    { property: "og:description", content: seo.ogDescription },
    { property: "og:url", content: seo.canonical },
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: seo.siteName },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo.ogTitle },
    { name: "twitter:description", content: seo.ogDescription },
  ];
  if (seo.keywords) {
    meta.push({ name: "keywords", content: seo.keywords });
  }
  if (seo.ogImage) {
    meta.push({ property: "og:image", content: seo.ogImage });
    meta.push({ name: "twitter:image", content: seo.ogImage });
  }
  if (seo.twitterHandle) {
    meta.push({ name: "twitter:site", content: seo.twitterHandle });
    meta.push({ name: "twitter:creator", content: seo.twitterHandle });
  }
  if (seo.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  } else {
    // Explicitamente indexável (Google/Bing + IAs), com preview completo.
    meta.push({
      name: "robots",
      content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    });
  }


  const scripts: ScriptEntry[] = [];
  if (seo.schemaType) {
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": seo.schemaType,
      name: seo.title,
      headline: seo.title,
      description: seo.description,
      url: seo.canonical,
      ...(seo.ogImage ? { image: seo.ogImage } : {}),
      ...(extraSchema ?? {}),
    };
    scripts.push({ type: "application/ld+json", children: JSON.stringify(ld) });
  }

  return {
    meta,
    links: [{ rel: "canonical", href: seo.canonical }],
    scripts,
  };
}

export const SEO_SITE_URL = SITE_URL;
