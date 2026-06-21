-- 1) Reviews: stop exposing user_id to anonymous visitors (correlation risk for anonymous reviews)
REVOKE SELECT (user_id) ON public.reviews FROM anon;
REVOKE SELECT (user_id) ON public.reviews FROM PUBLIC;

-- 2) two_fa_email_otp: add explicit deny policy so RLS is fully defined (service_role still bypasses)
REVOKE ALL ON public.two_fa_email_otp FROM anon, authenticated;
GRANT ALL ON public.two_fa_email_otp TO service_role;
DROP POLICY IF EXISTS "No client access" ON public.two_fa_email_otp;
CREATE POLICY "No client access to OTP codes"
  ON public.two_fa_email_otp
  AS PERMISSIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 3) two_fa_reset_requests: replace permissive WITH CHECK (true) with real validation
DROP POLICY IF EXISTS "Anyone can submit a reset request" ON public.two_fa_reset_requests;
CREATE POLICY "Submit own reset request"
  ON public.two_fa_reset_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND (user_id IS NULL OR user_id = auth.uid())
    AND length(trim(contact_email)) > 0
    AND length(trim(full_name)) > 0
    AND length(trim(message)) > 0
    AND resolved_by IS NULL
    AND resolved_at IS NULL
  );

-- 4) Lock down SECURITY DEFINER functions that should never be callable by clients
REVOKE EXECUTE ON FUNCTION public.dispatch_email_for_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dispatch_push_for_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_removal_request_decision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_user_on_owner_reply() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_claim_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_company_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owner_on_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.moderate_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_owner_reply_only() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 5) Pin search_path on the pgmq wrapper functions that were missing it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
