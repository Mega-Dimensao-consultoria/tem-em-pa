/**
 * Tipos compartilhados do sistema de SEO editável.
 */

export type SchemaType =
  | "WebPage"
  | "AboutPage"
  | "ContactPage"
  | "CollectionPage"
  | "Article"
  | "BlogPosting"
  | "NewsArticle"
  | "Product"
  | "LocalBusiness"
  | "Event"
  | "FAQPage"
  | "Organization";

export const SCHEMA_TYPE_OPTIONS: { value: SchemaType; label: string; hint: string }[] = [
  { value: "WebPage", label: "Página comum (WebPage)", hint: "Página institucional genérica" },
  { value: "AboutPage", label: "Sobre nós (AboutPage)", hint: "Página institucional 'quem somos'" },
  { value: "ContactPage", label: "Contato (ContactPage)", hint: "Página de contato" },
  { value: "CollectionPage", label: "Listagem (CollectionPage)", hint: "Listagens de itens (categorias, cidades)" },
  { value: "Article", label: "Artigo (Article)", hint: "Conteúdo editorial" },
  { value: "BlogPosting", label: "Post de blog (BlogPosting)", hint: "Post individual de blog" },
  { value: "NewsArticle", label: "Notícia (NewsArticle)", hint: "Notícia jornalística" },
  { value: "Product", label: "Produto (Product)", hint: "Ficha de produto" },
  { value: "LocalBusiness", label: "Empresa local (LocalBusiness)", hint: "Ficha de empresa/negócio" },
  { value: "Event", label: "Evento (Event)", hint: "Ficha de evento" },
  { value: "FAQPage", label: "FAQ (FAQPage)", hint: "Página de perguntas e respostas" },
  { value: "Organization", label: "Organização (Organization)", hint: "Ficha da organização" },
];

export type SeoOverride = {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  schema_type?: SchemaType | string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  canonical_url?: string | null;
  noindex?: boolean | null;
};

export type SeoTemplateKind = "company" | "city" | "category" | "event";

export type SeoTemplate = {
  title: string;
  description: string;
  og_image_url: string | null;
};

export type SeoGlobals = {
  site_name: string;
  site_tagline: string | null;
  title_base: string;
  title_separator: string;
  default_description: string;
  default_keywords: string | null;
  default_og_image_url: string | null;
  twitter_handle: string | null;
  org_name: string | null;
  org_logo_url: string | null;
  org_social_urls: string[];
  google_site_verification: string | null;
  bing_site_verification: string | null;
  templates: Record<SeoTemplateKind, SeoTemplate>;
};

export type SeoTemplateVars = Record<string, string | number | null | undefined>;

/** Whitelist de variáveis disponíveis por tipo (para a UI de admin). */
export const TEMPLATE_VARIABLES: Record<SeoTemplateKind, string[]> = {
  company: ["nome", "cidade", "bairro", "categoria", "estado", "siteName"],
  city: ["cidade", "estado", "siteName"],
  category: ["categoria", "cidade", "estado", "siteName"],
  event: ["nome", "cidade", "estado", "data", "siteName"],
};

export const TEMPLATE_LABELS: Record<SeoTemplateKind, string> = {
  company: "Página de empresa",
  city: "Página de cidade",
  category: "Categoria em uma cidade",
  event: "Página de evento",
};

export const DEFAULT_GLOBALS: SeoGlobals = {
  site_name: "Tem na minha cidade",
  site_tagline:
    "O guia local por cidade. Descubra empresas, produtos e serviços perto de você.",
  title_base: "Tem na minha cidade",
  title_separator: " — ",
  default_description:
    "Descubra restaurantes, mercados, serviços e comércio local em qualquer cidade do Brasil.",
  default_keywords:
    "guia local, empresas, comércio local, serviços na minha cidade, avaliações",
  default_og_image_url: null,
  twitter_handle: null,
  org_name: "Tem na minha cidade",
  org_logo_url: null,
  org_social_urls: [],
  google_site_verification: null,
  bing_site_verification: null,
  templates: {
    company: {
      title: "{{nome}} em {{cidade}} — {{categoria}} | {{siteName}}",
      description:
        "Conheça {{nome}}, {{categoria}} em {{cidade}}. Endereço, telefone, horários, avaliações e mais.",
      og_image_url: null,
    },
    city: {
      title: "Empresas em {{cidade}} - {{estado}} | {{siteName}}",
      description:
        "Encontre empresas, serviços e eventos em {{cidade}}. Guia completo com avaliações e informações de contato.",
      og_image_url: null,
    },
    category: {
      title: "{{categoria}} em {{cidade}} | {{siteName}}",
      description:
        "Lista completa de {{categoria}} em {{cidade}}. Compare, avalie e encontre a melhor opção.",
      og_image_url: null,
    },
    event: {
      title: "{{nome}} em {{cidade}} — {{data}} | {{siteName}}",
      description: "{{nome}} acontece em {{cidade}} no dia {{data}}. Veja todos os detalhes do evento.",
      og_image_url: null,
    },
  },
};
