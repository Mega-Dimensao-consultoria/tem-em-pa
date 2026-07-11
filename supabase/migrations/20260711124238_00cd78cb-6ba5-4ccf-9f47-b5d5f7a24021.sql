
ALTER TABLE public.site_seo_settings
  ADD COLUMN IF NOT EXISTS default_keywords text,
  ADD COLUMN IF NOT EXISTS site_tagline text;

ALTER TABLE public.site_pages
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS schema_type text;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS schema_type text;

ALTER TABLE public.blog_categories
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS schema_type text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS schema_type text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS schema_type text;

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS schema_type text;

ALTER TABLE public.city_events
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS schema_type text;
