
-- Function: resolve or create neighborhood atomically for a given city.
CREATE OR REPLACE FUNCTION public.get_or_create_neighborhood(
  _city_id UUID,
  _name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_name TEXT;
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _city_id IS NULL THEN
    RAISE EXCEPTION 'city_id required';
  END IF;
  v_name := trim(coalesce(_name, ''));
  IF length(v_name) < 2 OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'invalid neighborhood name';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cities WHERE id = _city_id AND is_active = true) THEN
    RAISE EXCEPTION 'city not found or inactive';
  END IF;

  v_slug := public.slugify(v_name);
  IF length(v_slug) < 2 THEN
    RAISE EXCEPTION 'invalid neighborhood slug';
  END IF;

  SELECT id INTO v_id FROM public.neighborhoods
   WHERE city_id = _city_id AND slug = v_slug LIMIT 1;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.neighborhoods (city_id, name, slug, is_active)
  VALUES (_city_id, v_name, v_slug, true)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_neighborhood(UUID, TEXT) TO authenticated;

-- Drop the permissive INSERT policy; admins still manage via "Admins manage neighborhoods".
DROP POLICY IF EXISTS "Authenticated can propose neighborhoods" ON public.neighborhoods;
