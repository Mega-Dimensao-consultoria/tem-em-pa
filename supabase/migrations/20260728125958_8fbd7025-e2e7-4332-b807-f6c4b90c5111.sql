CREATE OR REPLACE FUNCTION public.search_companies_autocomplete(q text, _city_id uuid, lim integer DEFAULT 8)
 RETURNS TABLE(id uuid, name text, slug text, neighborhood text, logo_url text, city_slug text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  uq text := public.immutable_unaccent(lower(coalesce(q,'')));
  cap int := LEAST(GREATEST(lim, 1), 20);
BEGIN
  IF length(uq) < 2 THEN RETURN; END IF;

  RETURN QUERY
  WITH prefix AS (
    SELECT c.id, c.name, c.slug, c.neighborhood_id, c.city_id, c.logo_url, c.is_featured, 1 AS tier
    FROM public.companies c
    WHERE c.status = 'approved'
      AND (_city_id IS NULL OR c.city_id = _city_id)
      AND public.immutable_unaccent(lower(c.name)) LIKE uq || '%'
    ORDER BY c.is_featured DESC, c.name ASC
    LIMIT cap
  ),
  contains AS (
    SELECT c.id, c.name, c.slug, c.neighborhood_id, c.city_id, c.logo_url, c.is_featured, 2 AS tier
    FROM public.companies c
    WHERE c.status = 'approved'
      AND (_city_id IS NULL OR c.city_id = _city_id)
      AND public.immutable_unaccent(lower(c.name)) LIKE '%' || uq || '%'
      AND c.id NOT IN (SELECT p.id FROM prefix p)
    ORDER BY c.is_featured DESC, c.name ASC
    LIMIT cap
  ),
  fts AS (
    SELECT c.id, c.name, c.slug, c.neighborhood_id, c.city_id, c.logo_url, c.is_featured, 3 AS tier
    FROM public.companies c
    WHERE c.status = 'approved'
      AND (_city_id IS NULL OR c.city_id = _city_id)
      AND c.search_tsv @@ websearch_to_tsquery('portuguese', uq)
      AND c.id NOT IN (SELECT p.id FROM prefix p)
      AND c.id NOT IN (SELECT co.id FROM contains co)
    ORDER BY ts_rank(c.search_tsv, websearch_to_tsquery('portuguese', uq)) DESC,
             c.is_featured DESC, c.name ASC
    LIMIT cap
  ),
  merged AS (
    SELECT * FROM prefix
    UNION ALL SELECT * FROM contains
    UNION ALL SELECT * FROM fts
  )
  SELECT m.id, m.name, m.slug, n.name AS neighborhood, m.logo_url, ci.slug AS city_slug
  FROM merged m
  LEFT JOIN public.neighborhoods n ON n.id = m.neighborhood_id
  LEFT JOIN public.cities ci ON ci.id = m.city_id
  ORDER BY m.tier ASC, m.is_featured DESC, m.name ASC
  LIMIT cap;
END;
$function$;