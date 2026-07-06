
-- ============================================================================
-- 1) Defense-in-depth trigger for public.city_events
-- ============================================================================
-- Even if RLS is somehow relaxed, this trigger guarantees that:
--   * A non-admin user can only insert/update an event whose company_id
--     belongs to a company they own.
--   * No one (except admin) can move an existing event to another company
--     by changing its company_id.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_city_event_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  v_owns_target boolean;
BEGIN
  -- Admin bypass
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- On UPDATE: disallow moving the event to another company
  IF TG_OP = 'UPDATE' THEN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'city_events.company_id cannot be changed';
    END IF;
  END IF;

  -- Verify ownership of the target company
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = NEW.company_id
      AND c.owner_id = auth.uid()
  ) INTO v_owns_target;

  IF NOT v_owns_target THEN
    RAISE EXCEPTION 'You cannot create or modify events for a company you do not own';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_city_events_enforce_ownership ON public.city_events;
CREATE TRIGGER trg_city_events_enforce_ownership
  BEFORE INSERT OR UPDATE ON public.city_events
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_city_event_ownership();

-- ============================================================================
-- 2) reviews_public view: hides user_id when the review is anonymous
-- ============================================================================
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

GRANT SELECT ON public.reviews_public TO anon, authenticated;

-- ============================================================================
-- 3) pgmq wrappers hygiene: ensure search_path is set
-- ============================================================================
-- (These functions already had SET search_path in most cases; re-run defensively.)
ALTER FUNCTION public.enqueue_email(text, jsonb)        SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint)        SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb)   SET search_path = public, pgmq;
