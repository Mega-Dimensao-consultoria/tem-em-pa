-- 1) Enable trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- 2) Immutable wrapper around unaccent so we can index on unaccent(lower(name))
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
SET search_path = public, extensions
AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- 3) Trigram GIN index on unaccented lower(name), partial to approved rows
CREATE INDEX IF NOT EXISTS companies_name_unaccent_trgm_idx
  ON public.companies
  USING gin ((public.immutable_unaccent(lower(name))) extensions.gin_trgm_ops)
  WHERE status = 'approved';

-- 4) Trigram GIN index on raw name so ILIKE '%q%' also uses an index
CREATE INDEX IF NOT EXISTS companies_name_trgm_idx
  ON public.companies
  USING gin (name extensions.gin_trgm_ops)
  WHERE status = 'approved';

-- 5) Rewrite autocomplete RPC to use the new indexed expression and drop the
--    slow "contains anywhere" branch as an OR against tsv (which forced a seq
--    scan). Prefix + FTS cover the vast majority of user queries; substring
--    match is preserved via a separate trigram condition that the index above
--    can accelerate.
CREATE OR REPLACE FUNCTION public.search_companies_autocomplete(q text, _city_id uuid, lim integer DEFAULT 8)
 RETURNS TABLE(id uuid, name text, slug text, neighborhood text, logo_url text, city_slug text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  WITH nq AS (
    SELECT public.immutable_unaccent(lower(coalesce(q, ''))) AS uq
  )
  SELECT c.id, c.name, c.slug, n.name AS neighborhood, c.logo_url, ci.slug AS city_slug
  FROM public.companies c
  LEFT JOIN public.neighborhoods n ON n.id = c.neighborhood_id
  LEFT JOIN public.cities ci ON ci.id = c.city_id
  CROSS JOIN nq
  WHERE c.status = 'approved'
    AND (_city_id IS NULL OR c.city_id = _city_id)
    AND (
      public.immutable_unaccent(lower(c.name)) LIKE nq.uq || '%'
      OR public.immutable_unaccent(lower(c.name)) LIKE '%' || nq.uq || '%'
      OR c.search_tsv @@ websearch_to_tsquery('portuguese', nq.uq)
    )
  ORDER BY
    (public.immutable_unaccent(lower(c.name)) LIKE nq.uq || '%') DESC,
    ts_rank(c.search_tsv, websearch_to_tsquery('portuguese', nq.uq)) DESC,
    c.is_featured DESC,
    c.name ASC
  LIMIT LEAST(GREATEST(lim, 1), 20);
$function$;