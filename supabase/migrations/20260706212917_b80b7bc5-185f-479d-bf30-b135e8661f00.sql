
-- 1) Column-level revoke on reviews.user_id for anon/authenticated
--    (admins & service_role keep full access; RLS still allows author reads via has_role/other paths)
REVOKE SELECT (user_id) ON public.reviews FROM anon, authenticated;

-- Re-grant safe columns explicitly to authenticated so their SELECTs (which
-- never request user_id) keep working. anon retains its existing table grant
-- via policy (unchanged).
GRANT SELECT (id, company_id, rating, comment, created_at, status, is_anonymous, owner_reply, owner_reply_at)
  ON public.reviews TO authenticated, anon;

-- Author still needs to insert user_id
GRANT INSERT (user_id, company_id, rating, comment, is_anonymous) ON public.reviews TO authenticated;

-- 2) Owner-safe reviews accessor: hides user_id when anonymous.
CREATE OR REPLACE FUNCTION public.get_company_reviews_for_owner(_company_id uuid)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  rating int,
  comment text,
  created_at timestamptz,
  status text,
  is_anonymous boolean,
  owner_reply text,
  owner_reply_at timestamptz,
  user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.company_id, r.rating, r.comment, r.created_at, r.status,
         r.is_anonymous, r.owner_reply, r.owner_reply_at,
         CASE WHEN r.is_anonymous THEN NULL ELSE r.user_id END AS user_id
    FROM public.reviews r
   WHERE r.company_id = _company_id
     AND (
       EXISTS (SELECT 1 FROM public.companies c
                WHERE c.id = r.company_id AND c.owner_id = auth.uid())
       OR public.has_role(auth.uid(), 'admin'::app_role)
     )
   ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_company_reviews_for_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_reviews_for_owner(uuid) TO authenticated;

-- 3) pgmq wrapper hardening: fix mutable search_path
ALTER FUNCTION public.enqueue_email(text, jsonb)          SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint)          SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb)   SET search_path = public, pgmq;
