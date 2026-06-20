-- 1) Move pg_net to extensions schema (extension doesn't support SET SCHEMA; recreate).
--    The 'net' schema (where http_post lives) is owned by the extension and will be
--    recreated automatically, so the trigger that calls net.http_post keeps working.
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- 2) app_settings: explicit admin-only SELECT policy
DROP POLICY IF EXISTS "Admins can read app settings" ON public.app_settings;
CREATE POLICY "Admins can read app settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Hide reviews.user_id via column-level grants.
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (
  id, company_id, rating, comment, status, created_at, updated_at,
  is_anonymous, owner_reply, owner_reply_at
) ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;