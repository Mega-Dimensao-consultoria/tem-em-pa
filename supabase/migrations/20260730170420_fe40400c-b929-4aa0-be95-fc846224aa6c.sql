CREATE OR REPLACE FUNCTION public.purge_email_dlq()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE a bigint := 0; t bigint := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  BEGIN
    SELECT count(*) INTO a FROM pgmq.q_auth_emails_dlq;
    PERFORM pgmq.purge_queue('auth_emails_dlq');
  EXCEPTION WHEN OTHERS THEN a := 0;
  END;
  BEGIN
    SELECT count(*) INTO t FROM pgmq.q_transactional_emails_dlq;
    PERFORM pgmq.purge_queue('transactional_emails_dlq');
  EXCEPTION WHEN OTHERS THEN t := 0;
  END;
  RETURN jsonb_build_object('auth_emails_dlq', a, 'transactional_emails_dlq', t);
END;
$$;

REVOKE ALL ON FUNCTION public.purge_email_dlq() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_email_dlq() TO authenticated, service_role;