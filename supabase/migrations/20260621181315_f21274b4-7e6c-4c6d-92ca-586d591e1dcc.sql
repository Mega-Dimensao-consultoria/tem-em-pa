
-- Refactor: distinguish company status transitions
CREATE OR REPLACE FUNCTION public.notify_on_company_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notif_type TEXT;
  title TEXT;
  message TEXT;
  link TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.status = 'approved' AND OLD.status IN ('pending','claimed_pending') THEN
    notif_type := 'company_approved';
    title := 'Empresa aprovada e publicada';
    message := 'Sua empresa ' || NEW.name || ' acaba de ser aprovada e já está visível para todos os usuários. Aproveite para completar o cadastro: adicione logo, fotos, descrição detalhada e horário de funcionamento para atrair mais clientes.';
    link := '/owner/empresa/' || NEW.id || '/dashboard';
  ELSIF NEW.status = 'rejected' AND OLD.status IN ('pending','claimed_pending') THEN
    notif_type := 'company_rejected';
    title := 'Cadastro não aprovado';
    message := 'O cadastro da empresa ' || NEW.name || ' não foi aprovado. Revise as informações fornecidas, especialmente endereço, contato e descrição, e envie novamente. Em caso de dúvida, entre em contato com nosso suporte.';
    link := '/owner';
  ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    notif_type := 'company_suspended';
    title := 'Empresa suspensa do diretório';
    message := 'A empresa ' || NEW.name || ' foi suspensa pela moderação e não está mais visível no diretório público. Se você acredita que houve um engano, entre em contato com o suporte para revisar a decisão.';
    link := '/owner/empresa/' || NEW.id || '/dashboard';
  ELSIF NEW.status = 'approved' AND OLD.status = 'rejected' THEN
    notif_type := 'company_republished';
    title := 'Empresa republicada';
    message := 'A empresa ' || NEW.name || ' voltou a ser exibida no diretório público. Aproveite para revisar as informações e responder eventuais avaliações recebidas.';
    link := '/owner/empresa/' || NEW.id || '/dashboard';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.create_notification(
    NEW.owner_id,
    notif_type,
    title,
    message,
    link,
    jsonb_build_object('company_id', NEW.id, 'status', NEW.status, 'previous_status', OLD.status)
  );
  RETURN NEW;
END; $function$;

-- New: notify owner BEFORE company deletion
CREATE OR REPLACE FUNCTION public.notify_on_company_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.owner_id IS NULL THEN RETURN OLD; END IF;
  PERFORM public.create_notification(
    OLD.owner_id,
    'company_deleted',
    'Empresa removida do diretório',
    'A empresa ' || OLD.name || ' foi removida permanentemente do diretório pela moderação. Caso queira cadastrá-la novamente ou entender o motivo, entre em contato com o suporte.',
    NULL,
    jsonb_build_object('company_id', OLD.id, 'company_name', OLD.name)
  );
  RETURN OLD;
END; $function$;

DROP TRIGGER IF EXISTS trg_notify_on_company_delete ON public.companies;
CREATE TRIGGER trg_notify_on_company_delete
  BEFORE DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_company_delete();

-- New: notify current owner when someone submits a claim
CREATE OR REPLACE FUNCTION public.notify_owner_on_claim_received()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id UUID;
  v_company_name TEXT;
BEGIN
  SELECT owner_id, name INTO v_owner_id, v_company_name
    FROM public.companies WHERE id = NEW.company_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  PERFORM public.create_notification(
    v_owner_id,
    'claim_received',
    'Pedido de reivindicação recebido',
    'Um usuário solicitou reivindicar a empresa ' || COALESCE(v_company_name,'') || '. Nossa equipe vai analisar os documentos e você será notificado sobre a decisão. Se você é o real responsável e ainda não confirmou seu vínculo, verifique seu cadastro.',
    '/owner',
    jsonb_build_object('company_id', NEW.company_id, 'claim_id', NEW.id)
  );
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_notify_owner_on_claim_received ON public.company_claims;
CREATE TRIGGER trg_notify_owner_on_claim_received
  AFTER INSERT ON public.company_claims
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_claim_received();

-- New: notify owner when someone submits a removal request
CREATE OR REPLACE FUNCTION public.notify_owner_on_removal_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id UUID;
  v_company_name TEXT;
BEGIN
  SELECT owner_id, name INTO v_owner_id, v_company_name
    FROM public.companies WHERE id = NEW.company_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  PERFORM public.create_notification(
    v_owner_id,
    'removal_request_received',
    'Solicitação de remoção da empresa',
    'Um usuário solicitou a remoção da empresa ' || COALESCE(v_company_name,'') || ' do diretório. Nossa moderação vai analisar o pedido. Se a empresa ainda está ativa, mantenha as informações atualizadas para evitar confusões.',
    '/owner/empresa/' || NEW.company_id || '/dashboard',
    jsonb_build_object('company_id', NEW.company_id, 'removal_id', NEW.id)
  );
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_notify_owner_on_removal_request ON public.company_removal_requests;
CREATE TRIGGER trg_notify_owner_on_removal_request
  AFTER INSERT ON public.company_removal_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_removal_request();

-- Expand email dispatcher to cover the new + previously-missing types
CREATE OR REPLACE FUNCTION public.dispatch_email_for_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'company_removal_approved', 'company_removal_rejected'
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
$function$;
