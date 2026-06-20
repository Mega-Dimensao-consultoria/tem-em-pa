-- 1) Replace permissive owner UPDATE policy with a dedicated RPC.
DROP POLICY IF EXISTS "Owner can reply to reviews" ON public.reviews;

CREATE OR REPLACE FUNCTION public.reply_to_review(
  p_review_id uuid,
  p_reply text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_company_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT company_id INTO v_company_id FROM public.reviews WHERE id = p_review_id;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'review not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = v_company_id AND c.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_reply IS NOT NULL AND length(trim(p_reply)) > 1000 THEN
    RAISE EXCEPTION 'reply too long';
  END IF;

  UPDATE public.reviews
  SET owner_reply = CASE WHEN p_reply IS NULL OR length(trim(p_reply)) = 0 THEN NULL ELSE p_reply END,
      owner_reply_at = CASE WHEN p_reply IS NULL OR length(trim(p_reply)) = 0 THEN NULL ELSE now() END
  WHERE id = p_review_id;
END; $$;

-- 2) Lock down SECURITY DEFINER function EXECUTE: revoke from PUBLIC, re-grant minimally.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_reviews() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reply_to_review(uuid, text) FROM PUBLIC;

-- has_role is referenced by RLS policies evaluated for anon and authenticated.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
-- get_my_reviews is called by signed-in users.
GRANT EXECUTE ON FUNCTION public.get_my_reviews() TO authenticated;
-- reply_to_review is the new owner-reply RPC.
GRANT EXECUTE ON FUNCTION public.reply_to_review(uuid, text) TO authenticated;
-- create_notification is invoked only by other SECURITY DEFINER triggers (table owner),
-- so no client/role needs EXECUTE.

-- Trigger functions (handle_new_user, moderate_review, set_updated_at, enforce_product_limit,
-- notify_user_on_owner_reply, notify_on_claim_status, notify_on_company_status,
-- notify_owner_on_review, enforce_owner_reply_only, dispatch_push_for_notification)
-- run as table owner via triggers and don't need PUBLIC EXECUTE.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.moderate_review() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_product_limit() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_user_on_owner_reply() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_claim_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_company_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_owner_on_review() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_owner_reply_only() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dispatch_push_for_notification() FROM PUBLIC;