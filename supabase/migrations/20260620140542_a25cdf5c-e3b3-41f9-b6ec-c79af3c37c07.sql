
-- 1) Hide reviews.user_id from public roles to prevent correlating anonymous reviews to accounts.
REVOKE SELECT (user_id) ON public.reviews FROM anon, authenticated;

-- Helper RPC so the signed-in user can still load their own reviews (returns full row incl. their own user_id).
CREATE OR REPLACE FUNCTION public.get_my_reviews()
RETURNS SETOF public.reviews
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM public.reviews r
  WHERE r.user_id = auth.uid()
  ORDER BY r.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_reviews() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_reviews() TO authenticated;

-- 2) Restrict company_events inserts to approved companies only.
DROP POLICY IF EXISTS "Authenticated insert events for existing company" ON public.company_events;

CREATE POLICY "Authenticated insert events for approved companies"
ON public.company_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = company_events.company_id
      AND c.status = 'approved'
  )
);
