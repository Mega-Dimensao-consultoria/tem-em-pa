CREATE OR REPLACE FUNCTION public.search_companies_autocomplete(q text, _city_id uuid, lim integer DEFAULT 8)
 RETURNS TABLE(id uuid, name text, slug text, neighborhood text, logo_url text, city_slug text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  WITH nq AS (
    SELECT extensions.unaccent(lower(coalesce(q, ''))) AS uq
  )
  SELECT c.id, c.name, c.slug, n.name AS neighborhood, c.logo_url, ci.slug AS city_slug
  FROM public.companies c
  LEFT JOIN public.neighborhoods n ON n.id = c.neighborhood_id
  LEFT JOIN public.cities ci ON ci.id = c.city_id
  CROSS JOIN nq
  WHERE c.status = 'approved'
    AND (_city_id IS NULL OR c.city_id = _city_id)
    AND (
      c.search_tsv @@ websearch_to_tsquery('portuguese', nq.uq)
      OR extensions.unaccent(lower(c.name)) LIKE nq.uq || '%'
      OR extensions.unaccent(lower(c.name)) LIKE '%' || nq.uq || '%'
    )
  ORDER BY
    -- Prefix matches first, then substring, then FTS only
    (extensions.unaccent(lower(c.name)) LIKE nq.uq || '%') DESC,
    ts_rank(c.search_tsv, websearch_to_tsquery('portuguese', nq.uq)) DESC,
    c.is_featured DESC,
    c.name ASC
  LIMIT LEAST(GREATEST(lim, 1), 20);
$function$;