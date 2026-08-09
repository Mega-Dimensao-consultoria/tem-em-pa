-- Função para reprocessar DLQ
CREATE OR REPLACE FUNCTION public.retry_email_dlq()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  auth_count bigint := 0;
  trans_count bigint := 0;
  r record;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR r IN (SELECT * FROM pgmq.q_auth_emails_dlq) LOOP
    PERFORM public.enqueue_email('auth_emails', r.message);
    PERFORM pgmq.delete('auth_emails_dlq', r.msg_id);
    auth_count := auth_count + 1;
  END LOOP;

  FOR r IN (SELECT * FROM pgmq.q_transactional_emails_dlq) LOOP
    PERFORM public.enqueue_email('transactional_emails', r.message);
    PERFORM pgmq.delete('transactional_emails_dlq', r.msg_id);
    trans_count := trans_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'auth_emails_retried', auth_count,
    'transactional_emails_retried', trans_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.retry_email_dlq() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retry_email_dlq() TO authenticated, service_role;

-- Função para limpar fila pendente
CREATE OR REPLACE FUNCTION public.purge_email_queue()
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
    SELECT count(*) INTO a FROM pgmq.q_auth_emails;
    PERFORM pgmq.purge_queue('auth_emails');
  EXCEPTION WHEN OTHERS THEN a := 0;
  END;
  
  BEGIN
    SELECT count(*) INTO t FROM pgmq.q_transactional_emails;
    PERFORM pgmq.purge_queue('transactional_emails');
  EXCEPTION WHEN OTHERS THEN t := 0;
  END;
  
  RETURN jsonb_build_object('auth_emails', a, 'transactional_emails', t);
END;
$$;

REVOKE ALL ON FUNCTION public.purge_email_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_email_queue() TO authenticated, service_role;
