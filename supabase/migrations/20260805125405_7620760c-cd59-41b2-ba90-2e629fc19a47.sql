CREATE OR REPLACE FUNCTION public.company_moderation_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT lower(coalesce(value, 'true')) = 'true'
       FROM public.app_settings
      WHERE key = 'company_moderation_enabled'),
    true
  )
$$;

GRANT EXECUTE ON FUNCTION public.company_moderation_enabled() TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "Authenticated can submit companies" ON public.companies;

CREATE POLICY "Authenticated can submit companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
  AND (
    status = 'pending'::company_status
    OR (status = 'approved'::company_status AND NOT public.company_moderation_enabled())
  )
);