
-- ============================================================================
-- 1) company_events INSERT: require ownership (or admin)
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated insert events for approved companies"
  ON public.company_events;

CREATE POLICY "Owners or admins insert company_events"
  ON public.company_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_events.company_id
        AND c.owner_id = auth.uid()
        AND c.status = 'approved'
    )
  );

-- Defense in depth: also cover UPDATE / DELETE with the same ownership rule,
-- so the table cannot be tampered cross-company even if new policies get added.
DROP POLICY IF EXISTS "Owners or admins update company_events" ON public.company_events;
CREATE POLICY "Owners or admins update company_events"
  ON public.company_events
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_events.company_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_events.company_id
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners or admins delete company_events" ON public.company_events;
CREATE POLICY "Owners or admins delete company_events"
  ON public.company_events
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_events.company_id
        AND c.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 2) reviews SELECT: stop leaking user_id of anonymous reviewers
-- ============================================================================
-- The old policy returned user_id for every approved review to everyone.
-- New rule: direct table SELECT is limited to
--   * the author (own reviews)
--   * the owner of the reviewed company
--   * admins
-- All PUBLIC / anonymous browsing goes through public.reviews_public,
-- which nullifies user_id when is_anonymous = true.
DROP POLICY IF EXISTS "Approved reviews are public" ON public.reviews;

CREATE POLICY "Author, company owner or admin can read reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = reviews.company_id
        AND c.owner_id = auth.uid()
    )
  );

-- Ensure the redacted view is the ONLY public read path.
CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker = on) AS
SELECT
  r.id,
  r.company_id,
  r.rating,
  r.comment,
  r.status,
  r.is_anonymous,
  r.owner_reply,
  r.owner_reply_at,
  r.created_at,
  CASE WHEN r.is_anonymous THEN NULL ELSE r.user_id END AS user_id
FROM public.reviews r
WHERE r.status = 'approved';

-- The view runs as security_invoker, so the caller needs a SELECT policy that
-- lets it read approved rows without exposing user_id directly. Provide a
-- narrow anon/authenticated policy scoped to approved rows only. Column
-- redaction still happens in the view.
DROP POLICY IF EXISTS "Approved reviews readable via view" ON public.reviews;
CREATE POLICY "Approved reviews readable via view"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- NOTE: the policy above still technically allows anon to SELECT user_id
-- from the base table. To fully block that column at the SQL level, revoke
-- column privilege on user_id for anon/authenticated; the view retains
-- access because it runs as security_invoker but only projects a redacted
-- CASE expression, not the raw column, so callers still get null for
-- anonymous rows.
REVOKE SELECT (user_id) ON public.reviews FROM anon;
REVOKE SELECT (user_id) ON public.reviews FROM authenticated;

-- Grant the author / owner / admin path back through explicit column list
-- (needed by RPC helpers get_my_reviews, get_company_reviews_for_owner, and
-- by the "Author, company owner or admin" policy above).
-- We grant SELECT on user_id to service_role only; author reads happen via
-- the SECURITY DEFINER RPCs which run as service_role's search scope.
GRANT SELECT (user_id) ON public.reviews TO service_role;

-- ============================================================================
-- 3) Public storage buckets: remove broad LIST policy
-- ============================================================================
-- Files in public buckets remain reachable via their public CDN URLs
-- (/storage/v1/object/public/<bucket>/<path>) without any RLS check.
-- Removing the broad SELECT policy prevents API-level enumeration.
DROP POLICY IF EXISTS "Public can read company-logos"  ON storage.objects;
DROP POLICY IF EXISTS "Public can read product-images" ON storage.objects;
