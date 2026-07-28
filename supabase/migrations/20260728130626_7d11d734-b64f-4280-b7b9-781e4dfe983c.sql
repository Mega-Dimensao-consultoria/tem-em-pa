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
  ids uuid[] := ARRAY[]::uuid[];
  tiers int[] := ARRAY[]::int[];
  need int;
BEGIN
  IF length(uq) < 2 THEN RETURN; END IF;

  -- Tier 1: prefix — no ORDER BY so btree streams and stops after LIMIT
  SELECT array_agg(t.id), array_agg(1)
    INTO ids, tiers
  FROM (
    SELECT c.id
    FROM public.companies c
    WHERE c.status = 'approved'
      AND (_city_id IS NULL OR c.city_id = _city_id)
      AND public.immutable_unaccent(lower(c.name)) LIKE uq || '%'
    LIMIT cap
  ) t;
  ids := COALESCE(ids, ARRAY[]::uuid[]);
  tiers := COALESCE(tiers, ARRAY[]::int[]);
  need := cap - COALESCE(array_length(ids,1),0);

  -- Tier 2: substring via trigram GIN
  IF need > 0 THEN
    WITH extra AS (
      SELECT c.id
      FROM public.companies c
      WHERE c.status = 'approved'
        AND (_city_id IS NULL OR c.city_id = _city_id)
        AND public.immutable_unaccent(lower(c.name)) LIKE '%' || uq || '%'
        AND NOT (c.id = ANY(ids))
      LIMIT need
    )
    SELECT ids || array_agg(e.id), tiers || array_agg(2)
      INTO ids, tiers
    FROM extra e;
    ids := COALESCE(ids, ARRAY[]::uuid[]);
    tiers := COALESCE(tiers, ARRAY[]::int[]);
    need := cap - COALESCE(array_length(ids,1),0);
  END IF;

  -- Tier 3: FTS fallback
  IF need > 0 THEN
    WITH extra AS (
      SELECT c.id, ts_rank(c.search_tsv, websearch_to_tsquery('portuguese', uq)) AS rnk, c.name
      FROM public.companies c
      WHERE c.status = 'approved'
        AND (_city_id IS NULL OR c.city_id = _city_id)
        AND c.search_tsv @@ websearch_to_tsquery('portuguese', uq)
        AND NOT (c.id = ANY(ids))
      ORDER BY ts_rank(c.search_tsv, websearch_to_tsquery('portuguese', uq)) DESC, c.name ASC
      LIMIT need
    )
    SELECT ids || array_agg(e.id ORDER BY e.rnk DESC, e.name ASC),
           tiers || array_agg(3 ORDER BY e.rnk DESC, e.name ASC)
      INTO ids, tiers
    FROM extra e;
    ids := COALESCE(ids, ARRAY[]::uuid[]);
    tiers := COALESCE(tiers, ARRAY[]::int[]);
  END IF;

  IF COALESCE(array_length(ids,1),0) = 0 THEN RETURN; END IF;

  RETURN QUERY
  SELECT c.id, c.name, c.slug, n.name AS neighborhood, c.logo_url, ci.slug AS city_slug
  FROM unnest(ids, tiers) WITH ORDINALITY AS u(cid, tier, ord)
  JOIN public.companies c ON c.id = u.cid
  LEFT JOIN public.neighborhoods n ON n.id = c.neighborhood_id
  LEFT JOIN public.cities ci ON ci.id = c.city_id
  ORDER BY u.ord;
END;
$function$;