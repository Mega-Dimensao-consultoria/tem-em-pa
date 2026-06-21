
-- Enum de motivos
DO $$ BEGIN
  CREATE TYPE public.removal_reason AS ENUM ('closed','incorrect','duplicate','owner_request','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.removal_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) tabela
CREATE TABLE public.company_removal_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason       public.removal_reason NOT NULL,
  details      text,
  status       public.removal_status NOT NULL DEFAULT 'pending',
  reviewed_by  uuid REFERENCES auth.users(id),
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_removal_company  ON public.company_removal_requests(company_id);
CREATE INDEX idx_removal_status   ON public.company_removal_requests(status);
CREATE INDEX idx_removal_user     ON public.company_removal_requests(user_id);

-- 2) grants
GRANT SELECT, INSERT ON public.company_removal_requests TO authenticated;
GRANT UPDATE ON public.company_removal_requests TO authenticated; -- admin gate via policy
GRANT ALL ON public.company_removal_requests TO service_role;

-- 3) RLS
ALTER TABLE public.company_removal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated create removal requests"
  ON public.company_removal_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see own removal requests, admins see all"
  ON public.company_removal_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update removal requests"
  ON public.company_removal_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) trigger updated_at
CREATE TRIGGER trg_removal_updated_at
  BEFORE UPDATE ON public.company_removal_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) trigger: ao aprovar, oculta a empresa (status='rejected') e notifica o autor
CREATE OR REPLACE FUNCTION public.handle_removal_request_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_name text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_company_name FROM public.companies WHERE id = NEW.company_id;

  IF NEW.status = 'approved' THEN
    UPDATE public.companies SET status = 'rejected' WHERE id = NEW.company_id;
    PERFORM public.create_notification(
      NEW.user_id,
      'company_removal_approved',
      'Solicitação de remoção aprovada',
      'A empresa ' || COALESCE(v_company_name,'') || ' foi removida do diretório após sua solicitação. Obrigado por nos ajudar a manter as informações corretas.',
      NULL,
      jsonb_build_object('company_id', NEW.company_id, 'removal_id', NEW.id)
    );
  ELSIF NEW.status = 'rejected' THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'company_removal_rejected',
      'Solicitação de remoção não aprovada',
      'Após análise, a empresa ' || COALESCE(v_company_name,'') || ' será mantida no diretório. Se você tem mais informações, envie novamente com detalhes adicionais.',
      '/empresa/' || NEW.company_id,
      jsonb_build_object('company_id', NEW.company_id, 'removal_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_removal_decision
  AFTER UPDATE ON public.company_removal_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_removal_request_decision();
