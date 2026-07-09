GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO PUBLIC;

GRANT USAGE ON TYPE public.app_role TO anon;
GRANT USAGE ON TYPE public.app_role TO authenticated;
GRANT USAGE ON TYPE public.app_role TO service_role;
GRANT USAGE ON TYPE public.app_role TO PUBLIC;