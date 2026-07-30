CREATE OR REPLACE FUNCTION public.notify_admins(_type text, _title text, _message text, _link text DEFAULT '/admin', _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE r RECORD; n int := 0;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.user_roles WHERE role = 'admin'::app_role LOOP
    PERFORM public.create_notification(r.user_id, _type, _title, _message, _link, _metadata);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_alert_on_moderation_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
  v_message text;
  v_label text;
  v_link text := '/admin';
  v_company text;
BEGIN
  IF TG_TABLE_NAME = 'company_claims' THEN
    SELECT name INTO v_company FROM public.companies WHERE id = NEW.company_id;
    v_label := 'Reivindicação de empresa';
    v_title := 'Nova reivindicação de empresa';
    v_message := 'A empresa ' || COALESCE(v_company, '(sem nome)') || ' recebeu um pedido de reivindicação que precisa ser analisado no painel.';
  ELSIF TG_TABLE_NAME = 'company_removal_requests' THEN
    SELECT name INTO v_company FROM public.companies WHERE id = NEW.company_id;
    v_label := 'Pedido de remoção';
    v_title := 'Novo pedido de remoção de empresa';
    v_message := 'Foi solicitada a remoção da empresa ' || COALESCE(v_company, '(sem nome)') || '. Motivo informado: ' || COALESCE(NEW.reason::text, 'não informado') || '.';
  ELSIF TG_TABLE_NAME = 'review_reports' THEN
    v_label := 'Denúncia de avaliação';
    v_title := 'Nova denúncia de avaliação';
    v_message := 'Uma avaliação foi denunciada por um usuário e aguarda análise da moderação.';
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    IF NEW.status IS DISTINCT FROM 'pending_moderation' THEN RETURN NULL; END IF;
    SELECT name INTO v_company FROM public.companies WHERE id = NEW.company_id;
    v_label := 'Avaliação em moderação';
    v_title := 'Avaliação retida para moderação';
    v_message := 'Uma avaliação da empresa ' || COALESCE(v_company, '(sem nome)') || ' foi retida automaticamente e precisa de revisão manual.';
  ELSIF TG_TABLE_NAME = 'companies' THEN
    IF NEW.status NOT IN ('pending', 'claimed_pending') THEN RETURN NULL; END IF;
    v_label := 'Empresa aguardando aprovação';
    v_title := 'Nova empresa aguardando aprovação';
    v_message := 'A empresa ' || COALESCE(NEW.name, '(sem nome)') || ' foi cadastrada e está aguardando aprovação da moderação.';
  ELSE
    RETURN NULL;
  END IF;

  PERFORM public.notify_admins(
    'admin_alert',
    v_title,
    v_message,
    v_link,
    jsonb_build_object('eventLabel', v_label, 'source_table', TG_TABLE_NAME, 'source_id', NEW.id)
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_alert_claims ON public.company_claims;
CREATE TRIGGER trg_admin_alert_claims AFTER INSERT ON public.company_claims
FOR EACH ROW EXECUTE FUNCTION public.admin_alert_on_moderation_event();

DROP TRIGGER IF EXISTS trg_admin_alert_removals ON public.company_removal_requests;
CREATE TRIGGER trg_admin_alert_removals AFTER INSERT ON public.company_removal_requests
FOR EACH ROW EXECUTE FUNCTION public.admin_alert_on_moderation_event();

DROP TRIGGER IF EXISTS trg_admin_alert_reports ON public.review_reports;
CREATE TRIGGER trg_admin_alert_reports AFTER INSERT ON public.review_reports
FOR EACH ROW EXECUTE FUNCTION public.admin_alert_on_moderation_event();

DROP TRIGGER IF EXISTS trg_admin_alert_reviews ON public.reviews;
CREATE TRIGGER trg_admin_alert_reviews AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.admin_alert_on_moderation_event();

DROP TRIGGER IF EXISTS trg_admin_alert_companies ON public.companies;
CREATE TRIGGER trg_admin_alert_companies AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.admin_alert_on_moderation_event();

CREATE OR REPLACE FUNCTION public.dispatch_email_for_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dispatch_url text;
  dispatch_secret text;
BEGIN
  IF NEW.type NOT IN (
    'review_new', 'review_reply',
    'company_approved', 'company_rejected',
    'company_suspended', 'company_republished', 'company_deleted',
    'claim_approved', 'claim_rejected', 'claim_received',
    'removal_request_received',
    'company_removal_approved', 'company_removal_rejected',
    'admin_alert'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT value INTO dispatch_url
    FROM public.app_settings WHERE key = 'notification_email_dispatch_url';
  SELECT value INTO dispatch_secret
    FROM public.app_settings WHERE key = 'push_dispatch_secret';

  IF dispatch_url IS NULL OR dispatch_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-dispatch-secret', dispatch_secret
    ),
    body := jsonb_build_object('notification_id', NEW.id)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;