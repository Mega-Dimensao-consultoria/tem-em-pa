CREATE OR REPLACE FUNCTION public.list_active_states()
RETURNS TABLE(uf text, city_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT state AS uf, count(*)::bigint AS city_count
  FROM public.cities
  WHERE is_active = true
  GROUP BY state
  ORDER BY state;
$$;

REVOKE ALL ON FUNCTION public.list_active_states() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_active_states() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.list_active_cities_by_state(_uf text)
RETURNS TABLE(id uuid, slug text, name text, state text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, slug, name, state
  FROM public.cities
  WHERE is_active = true AND state = upper(_uf)
  ORDER BY name;
$$;

REVOKE ALL ON FUNCTION public.list_active_cities_by_state(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_active_cities_by_state(text) TO anon, authenticated, service_role;