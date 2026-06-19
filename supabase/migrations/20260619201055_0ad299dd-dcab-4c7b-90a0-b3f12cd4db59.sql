
REVOKE EXECUTE ON FUNCTION public.moderate_review() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_owner_reply_only() FROM anon, authenticated, public;

DROP POLICY IF EXISTS "company-logos authenticated read" ON storage.objects;
