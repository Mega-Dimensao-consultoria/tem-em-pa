
DROP POLICY IF EXISTS "Public read company-logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
