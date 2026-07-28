DROP FUNCTION IF EXISTS public.sitemap_companies_page(int, int);
DROP FUNCTION IF EXISTS public.sitemap_neighborhoods_page(int, int);
DROP FUNCTION IF EXISTS public.sitemap_cities_page(int, int);

CREATE OR REPLACE FUNCTION public.sitemap_companies_page(_offset int, _limit int)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb)
  FROM (
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
  ) row
$$;

CREATE OR REPLACE FUNCTION public.sitemap_neighborhoods_page(_offset int, _limit int)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb)
  FROM (
    SELECT n.slug, ci.slug AS city_slug
    FROM public.neighborhoods n
    JOIN public.cities ci ON ci.id = n.city_id
    WHERE n.is_active = true
      AND ci.is_active = true
      AND (ci.noindex IS NULL OR ci.noindex = false)
      AND n.slug IS NOT NULL
    ORDER BY n.id
    LIMIT _limit OFFSET _offset
  ) row
$$;

CREATE OR REPLACE FUNCTION public.sitemap_cities_page(_offset int, _limit int)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
  SELECT COALESCE(jsonb_agg(slug), '[]'::jsonb)
  FROM (
    SELECT slug FROM public.cities
    WHERE is_active = true
      AND (noindex IS NULL OR noindex = false)
      AND slug IS NOT NULL
    ORDER BY id
    LIMIT _limit OFFSET _offset
  ) t
$$;

GRANT EXECUTE ON FUNCTION public.sitemap_companies_page(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sitemap_neighborhoods_page(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sitemap_cities_page(int, int) TO anon, authenticated;
