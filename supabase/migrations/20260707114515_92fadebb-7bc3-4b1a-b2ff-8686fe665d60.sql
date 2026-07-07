CREATE TABLE IF NOT EXISTS public.owner_alert_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  notify_new_review BOOLEAN NOT NULL DEFAULT true,
  notify_new_claim BOOLEAN NOT NULL DEFAULT true,
  min_review_rating SMALLINT NOT NULL DEFAULT 1 CHECK (min_review_rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_alert_prefs TO authenticated;
GRANT ALL ON public.owner_alert_prefs TO service_role;

ALTER TABLE public.owner_alert_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_alert_prefs owner read"
  ON public.owner_alert_prefs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "owner_alert_prefs owner insert"
  ON public.owner_alert_prefs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid())
  );

CREATE POLICY "owner_alert_prefs owner update"
  ON public.owner_alert_prefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_alert_prefs owner delete"
  ON public.owner_alert_prefs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_owner_alert_prefs_updated_at
  BEFORE UPDATE ON public.owner_alert_prefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update the review notification trigger to respect owner preferences.
CREATE OR REPLACE FUNCTION public.notify_owner_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id UUID;
  v_company_name TEXT;
  v_prefs RECORD;
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  SELECT owner_id, name INTO v_owner_id, v_company_name FROM public.companies WHERE id = NEW.company_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT notify_new_review, min_review_rating INTO v_prefs
    FROM public.owner_alert_prefs
    WHERE user_id = v_owner_id AND company_id = NEW.company_id;

  IF FOUND THEN
    IF v_prefs.notify_new_review = false THEN RETURN NEW; END IF;
    IF NEW.rating > v_prefs.min_review_rating THEN RETURN NEW; END IF;
  END IF;

  PERFORM public.create_notification(
    v_owner_id,
    'review_new',
    'Nova avaliação recebida',
    'Sua empresa ' || COALESCE(v_company_name,'') || ' recebeu uma nova avaliação de ' || NEW.rating || ' estrela(s). Acesse o painel para ler e responder.',
    '/owner/empresa/' || NEW.company_id || '/dashboard',
    jsonb_build_object('company_id', NEW.company_id, 'review_id', NEW.id, 'rating', NEW.rating)
  );
  RETURN NEW;
END; $function$;

-- Update the claim notification trigger to respect owner preferences.
CREATE OR REPLACE FUNCTION public.notify_owner_on_claim_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id UUID;
  v_company_name TEXT;
  v_notify BOOLEAN;
BEGIN
  SELECT owner_id, name INTO v_owner_id, v_company_name
    FROM public.companies WHERE id = NEW.company_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT notify_new_claim INTO v_notify
    FROM public.owner_alert_prefs
    WHERE user_id = v_owner_id AND company_id = NEW.company_id;
  IF v_notify = false THEN RETURN NEW; END IF;

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