CREATE OR REPLACE FUNCTION public.process_escolas_import()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat uuid;
  v_inserted int := 0;
  v_no_city int := 0;
  v_dup int := 0;
BEGIN
  SELECT id INTO v_cat FROM public.categories WHERE slug='utilidade-publica' LIMIT 1;
  IF v_cat IS NULL THEN RAISE EXCEPTION 'categoria utilidade-publica ausente'; END IF;

  INSERT INTO public.neighborhoods (city_id, name, slug, is_active)
  SELECT DISTINCT c.id, initcap(trim(s.neighborhood)), public.slugify(s.neighborhood), true
  FROM public._stg_escolas s
  JOIN public.cities c
    ON public.slugify(c.name) = public.slugify(s.city_name)
   AND c.state = upper(s.state)
  WHERE s.neighborhood IS NOT NULL
    AND length(trim(s.neighborhood)) >= 2
    AND length(public.slugify(s.neighborhood)) >= 2
  ON CONFLICT (city_id, slug) DO NOTHING;

  SELECT count(*) INTO v_no_city
  FROM public._stg_escolas s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.cities c
    WHERE public.slugify(c.name)=public.slugify(s.city_name)
      AND c.state = upper(s.state)
  );

  SELECT count(*) INTO v_dup
  FROM public._stg_escolas s
  WHERE EXISTS (
    SELECT 1 FROM public.companies e
    WHERE e.source='inep_escolas' AND e.external_id=s.external_id
  );

  WITH dedup AS (
    SELECT DISTINCT ON (external_id) *
    FROM public._stg_escolas
    ORDER BY external_id
  ), src AS (
    SELECT
      trim(s.name) AS name,
      left(s.external_id || '-' || public.slugify(s.name), 100) AS slug,
      c.id AS city_id,
      n.id AS neighborhood_id,
      s.external_id,
      s.description, s.address, s.number, s.complement, s.cep, s.phone_ddd,
      s.phone, s.whatsapp, s.email, s.website, s.instagram_url, s.facebook_url,
      lower(s.state) AS state
    FROM dedup s
    JOIN public.cities c
      ON public.slugify(c.name) = public.slugify(s.city_name)
     AND c.state = upper(s.state)
    LEFT JOIN public.neighborhoods n
      ON n.city_id = c.id
     AND n.slug = public.slugify(s.neighborhood)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.companies e
      WHERE e.source='inep_escolas' AND e.external_id = s.external_id
    )
  ), src2 AS (
    -- deduplica também por (city_id, slug) dentro do próprio lote
    SELECT DISTINCT ON (city_id, slug) * FROM src ORDER BY city_id, slug
  )
  INSERT INTO public.companies (
    name, slug, city_id, neighborhood_id, category_id, status, source, external_id,
    description, address, number, complement, cep, phone_ddd, phone, whatsapp,
    email, website, instagram_url, facebook_url
  )
  SELECT
    s.name, s.slug, s.city_id, s.neighborhood_id, v_cat,
    'approved'::company_status, 'inep_escolas', s.external_id,
    nullif(trim(coalesce(s.description,'')),''),
    nullif(trim(coalesce(s.address,'')),''),
    nullif(trim(coalesce(s.number,'')),''),
    nullif(trim(coalesce(s.complement,'')),''),
    nullif(trim(coalesce(s.cep,'')),''),
    nullif(trim(coalesce(s.phone_ddd,'')),''),
    nullif(trim(coalesce(s.phone,'')),''),
    nullif(trim(coalesce(s.whatsapp,'')),''),
    nullif(trim(coalesce(s.email,'')),''),
    nullif(trim(coalesce(s.website,'')),''),
    nullif(trim(coalesce(s.instagram_url,'')),''),
    nullif(trim(coalesce(s.facebook_url,'')),'')
  FROM src2 s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.companies e
    WHERE e.city_id = s.city_id AND e.slug = s.slug
  );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'skipped_no_city', v_no_city,
    'skipped_duplicate', v_dup
  );
END;
$$;