
-- Global SEO settings (singleton row)
CREATE TABLE public.site_seo_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  site_name text NOT NULL DEFAULT 'Tem na minha cidade',
  title_base text NOT NULL DEFAULT 'Tem na minha cidade',
  title_separator text NOT NULL DEFAULT ' — ',
  default_description text NOT NULL DEFAULT '',
  default_og_image_url text,
  twitter_handle text,
  org_name text,
  org_logo_url text,
  org_social_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  google_site_verification text,
  bing_site_verification text,
  templates jsonb NOT NULL DEFAULT jsonb_build_object(
    'company', jsonb_build_object(
      'title', '{{nome}} em {{cidade}} — {{categoria}} | {{siteName}}',
      'description', 'Conheça {{nome}}, {{categoria}} em {{cidade}}. Endereço, telefone, horários, avaliações e mais.',
      'og_image_url', null
    ),
    'city', jsonb_build_object(
      'title', 'Empresas em {{cidade}} - {{estado}} | {{siteName}}',
      'description', 'Encontre empresas, serviços e eventos em {{cidade}}. Guia completo com avaliações e informações de contato.',
      'og_image_url', null
    ),
    'category', jsonb_build_object(
      'title', '{{categoria}} em {{cidade}} | {{siteName}}',
      'description', 'Lista completa de {{categoria}} em {{cidade}}. Compare, avalie e encontre a melhor opção.',
      'og_image_url', null
    ),
    'event', jsonb_build_object(
      'title', '{{nome}} em {{cidade}} — {{data}} | {{siteName}}',
      'description', '{{nome}} acontece em {{cidade}} no dia {{data}}. Veja todos os detalhes do evento.',
      'og_image_url', null
    )
  ),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT site_seo_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.site_seo_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_seo_settings TO authenticated;
GRANT ALL ON public.site_seo_settings TO service_role;

ALTER TABLE public.site_seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_seo_settings public read"
  ON public.site_seo_settings FOR SELECT
  USING (true);

CREATE POLICY "site_seo_settings admin write"
  ON public.site_seo_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_seo_settings_updated_at
  BEFORE UPDATE ON public.site_seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_seo_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Per-page SEO fields on site_pages
ALTER TABLE public.site_pages
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN og_title text,
  ADD COLUMN og_description text,
  ADD COLUMN og_image_url text,
  ADD COLUMN canonical_url text,
  ADD COLUMN noindex boolean NOT NULL DEFAULT false;

-- SEO fields on blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN og_image_url text,
  ADD COLUMN canonical_url text,
  ADD COLUMN noindex boolean NOT NULL DEFAULT false;

-- SEO fields on blog_categories
ALTER TABLE public.blog_categories
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN og_image_url text,
  ADD COLUMN canonical_url text,
  ADD COLUMN noindex boolean NOT NULL DEFAULT false;

-- SEO override fields on companies (templates fall back when null)
ALTER TABLE public.companies
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN og_image_url text,
  ADD COLUMN canonical_url text,
  ADD COLUMN noindex boolean NOT NULL DEFAULT false;

-- SEO override fields on categories
ALTER TABLE public.categories
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN og_image_url text,
  ADD COLUMN canonical_url text,
  ADD COLUMN noindex boolean NOT NULL DEFAULT false;

-- SEO override fields on cities (og_image_url already exists)
ALTER TABLE public.cities
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN canonical_url text,
  ADD COLUMN noindex boolean NOT NULL DEFAULT false;

-- SEO override fields on city_events
ALTER TABLE public.city_events
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN og_image_url text,
  ADD COLUMN canonical_url text,
  ADD COLUMN noindex boolean NOT NULL DEFAULT false;
