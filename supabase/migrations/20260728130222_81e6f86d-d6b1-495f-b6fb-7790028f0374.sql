CREATE OR REPLACE FUNCTION public.search_companies_autocomplete(q text, _city_id uuid, lim integer DEFAULT 8)
 RETURNS TABLE(id uuid, name text, slug text, neighborhood text, logo_url text, city_slug text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
 SET plan_cache_mode TO 'force_custom_plan'
AS $function$
DECLARE
  uq text := public.immutable_unaccent(lower(coalesce(q,'')));
  cap int := LEAST(GREATEST(lim, 1), 20);
  got int := 0;
BEGIN
  IF length(uq) < 2 THEN RETURN; END IF;

  CREATE TEMP TABLE _sca_hits (
    id uuid PRIMARY KEY, name text, slug text, neighborhood_id uuid,
    city_id uuid, logo_url text, is_featured boolean, tier int
  ) ON COMMIT DROP;

  -- Tier 1: prefix (uses btree text_pattern_ops index)
  INSERT INTO _sca_hits
  SELECT c.id, c.name, c.slug, c.neighborhood_id, c.city_id, c.logo_url, c.is_featured, 1
  FROM public.companies c
  WHERE c.status = 'approved'
    AND (_city_id IS NULL OR c.city_id = _city_id)
    AND public.immutable_unaccent(lower(c.name)) LIKE uq || '%'
  ORDER BY c.is_featured DESC, c.name ASC
  LIMIT cap;
  GET DIAGNOSTICS got = ROW_COUNT;

  -- Tier 2: substring (uses trigram GIN); only if prefix didn't fill
  IF got < cap THEN
    INSERT INTO _sca_hits
    SELECT c.id, c.name, c.slug, c.neighborhood_id, c.city_id, c.logo_url, c.is_featured, 2
    FROM public.companies c
    WHERE c.status = 'approved'
      AND (_city_id IS NULL OR c.city_id = _city_id)
      AND public.immutable_unaccent(lower(c.name)) LIKE '%' || uq || '%'
      AND NOT EXISTS (SELECT 1 FROM _sca_hits h WHERE h.id = c.id)
    ORDER BY c.is_featured DESC, c.name ASC
    LIMIT cap - got
    ON CONFLICT (id) DO NOTHING;
    got := (SELECT count(*) FROM _sca_hits);
  END IF;

  -- Tier 3: FTS fallback
  IF got < cap THEN
    INSERT INTO _sca_hits
    SELECT c.id, c.name, c.slug, c.neighborhood_id, c.city_id, c.logo_url, c.is_featured, 3
    FROM public.companies c
    WHERE c.status = 'approved'
      AND (_city_id IS NULL OR c.city_id = _city_id)
      AND c.search_tsv @@ websearch_to_tsquery('portuguese', uq)
      AND NOT EXISTS (SELECT 1 FROM _sca_hits h WHERE h.id = c.id)
    ORDER BY ts_rank(c.search_tsv, websearch_to_tsquery('portuguese', uq)) DESC,
             c.is_featured DESC, c.name ASC
    LIMIT cap - got
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT h.id, h.name, h.slug, n.name AS neighborhood, h.logo_url, ci.slug AS city_slug
  FROM _sca_hits h
  LEFT JOIN public.neighborhoods n ON n.id = h.neighborhood_id
  LEFT JOIN public.cities ci ON ci.id = h.city_id
  ORDER BY h.tier ASC, h.is_featured DESC, h.name ASC
  LIMIT cap;
END;
$function$;