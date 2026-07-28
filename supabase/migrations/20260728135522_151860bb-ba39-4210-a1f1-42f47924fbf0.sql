CREATE INDEX IF NOT EXISTS companies_sitemap_id_idx
  ON public.companies (id)
  WHERE status = 'approved' AND (noindex IS NULL OR noindex = false);

CREATE INDEX IF NOT EXISTS neighborhoods_sitemap_id_idx
  ON public.neighborhoods (id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS cities_sitemap_id_idx
  ON public.cities (id)
  WHERE is_active = true AND (noindex IS NULL OR noindex = false);
