CREATE OR REPLACE FUNCTION public.sitemap_companies_page(_offset int, _limit int)
RETURNS TABLE(slug text, updated_at timestamptz, city_slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
  SELECT c.slug, c.updated_at, ci.slug AS city_slug
  FROM public.companies c
  JOIN public.cities ci ON ci.id = c.city_id
  WHERE c.status = 'approved'
    AND (c.noindex IS NULL OR c.noindex = false)
    AND ci.is_active = true
    AND (ci.noindex IS NULL OR ci.noindex = false)
    AND c.slug IS NOT NULL
  ORDER BY c.id
  LIMIT _limit OFFSET _offset
$$;

CREATE OR REPLACE FUNCTION public.sitemap_neighborhoods_page(_offset int, _limit int)
RETURNS TABLE(slug text, city_slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
  SELECT n.slug, ci.slug AS city_slug
  FROM public.neighborhoods n
  JOIN public.cities ci ON ci.id = n.city_id
  WHERE n.is_active = true
    AND ci.is_active = true
    AND (ci.noindex IS NULL OR ci.noindex = false)
    AND n.slug IS NOT NULL
  ORDER BY n.id
  LIMIT _limit OFFSET _offset
$$;

CREATE OR REPLACE FUNCTION public.sitemap_cities_page(_offset int, _limit int)
RETURNS TABLE(slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
  SELECT slug FROM public.cities
  WHERE is_active = true
    AND (noindex IS NULL OR noindex = false)
    AND slug IS NOT NULL
  ORDER BY id
  LIMIT _limit OFFSET _offset
$$;

GRANT EXECUTE ON FUNCTION public.sitemap_companies_page(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sitemap_neighborhoods_page(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sitemap_cities_page(int, int) TO anon, authenticated;
