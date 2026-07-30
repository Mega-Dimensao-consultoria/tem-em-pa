-- 1) Alerta de pedido de reset de 2FA para administradores
CREATE OR REPLACE FUNCTION public.notify_admins_on_two_fa_reset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    'admin_alert',
    'Novo pedido de redefinição de 2FA',
    'O usuário ' || COALESCE(NEW.full_name, 'sem nome') || ' (' || NEW.contact_email ||
    ') solicitou a redefinição da verificação em duas etapas.',
    '/admin',
    jsonb_build_object('event_label', 'Redefinição de 2FA', 'request_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_two_fa_reset ON public.two_fa_reset_requests;
CREATE TRIGGER trg_notify_admins_two_fa_reset
AFTER INSERT ON public.two_fa_reset_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_two_fa_reset();

-- 2) Monitoramento da fila de falhas (DLQ) de e-mails
CREATE OR REPLACE FUNCTION public.check_email_dlq_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq, extensions
AS $$
DECLARE
  auth_count bigint := 0;
  tx_count bigint := 0;
  total bigint := 0;
  last_alert timestamptz;
BEGIN
  BEGIN
    EXECUTE 'SELECT count(*) FROM pgmq.q_auth_emails_dlq' INTO auth_count;
  EXCEPTION WHEN OTHERS THEN auth_count := 0; END;
  BEGIN
    EXECUTE 'SELECT count(*) FROM pgmq.q_transactional_emails_dlq' INTO tx_count;
  EXCEPTION WHEN OTHERS THEN tx_count := 0; END;

  total := auth_count + tx_count;
  IF total = 0 THEN
    RETURN jsonb_build_object('total', 0, 'alerted', false);
  END IF;

  SELECT updated_at INTO last_alert
    FROM public.app_settings WHERE key = 'email_dlq_last_alert_at';

  IF last_alert IS NOT NULL AND last_alert > now() - interval '12 hours' THEN
    RETURN jsonb_build_object('total', total, 'alerted', false);
  END IF;

  PERFORM public.notify_admins(
    'admin_alert',
    'E-mails presos na fila de falhas',
    total || ' e-mail(s) não puderam ser entregues e estão na fila de falhas (' ||
    auth_count || ' de autenticação, ' || tx_count || ' transacionais). ' ||
    'Use o painel administrativo para limpar a fila.',
    '/admin',
    jsonb_build_object('event_label', 'Fila de e-mails', 'total', total)
  );

  INSERT INTO public.app_settings (key, value, updated_at)
  VALUES ('email_dlq_last_alert_at', total::text, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  RETURN jsonb_build_object('total', total, 'alerted', true);
END;
$$;

REVOKE ALL ON FUNCTION public.check_email_dlq_health() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admins_on_two_fa_reset() FROM PUBLIC;