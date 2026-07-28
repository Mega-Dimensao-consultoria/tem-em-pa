
CREATE TABLE IF NOT EXISTS public._stg_ddd (
  uf text,
  city_slug text,
  ddd text
);
GRANT ALL ON public._stg_ddd TO service_role;
ALTER TABLE public._stg_ddd ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stg_ddd_service" ON public._stg_ddd
  TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS _stg_ddd_lookup ON public._stg_ddd(uf, city_slug);

CREATE OR REPLACE FUNCTION public.backfill_company_ddd()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_updated int;
BEGIN
  WITH upd AS (
    UPDATE public.companies c
       SET phone_ddd = m.ddd
      FROM public.cities ci, public._stg_ddd m
     WHERE c.city_id = ci.id
       AND m.uf = ci.state
       AND m.city_slug = public.slugify(ci.name)
       AND c.phone_ddd IS NULL
     RETURNING 1
  )
  SELECT count(*) INTO v_updated FROM upd;
  RETURN jsonb_build_object('updated', v_updated);
END;
$$;
