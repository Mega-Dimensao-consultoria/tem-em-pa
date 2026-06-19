
-- 1) Table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "system inserts notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2) Helper to insert notifications from triggers (security definer)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _link TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id UUID;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (_user_id, _type, _title, _message, _link, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END; $$;

-- 3) Trigger: new review -> notify owner
CREATE OR REPLACE FUNCTION public.notify_owner_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id UUID;
  company_name TEXT;
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  SELECT owner_id, name INTO owner_id, company_name FROM public.companies WHERE id = NEW.company_id;
  IF owner_id IS NULL OR owner_id = NEW.user_id THEN RETURN NEW; END IF;
  PERFORM public.create_notification(
    owner_id,
    'review_new',
    'Nova avaliação recebida',
    'Sua empresa ' || COALESCE(company_name,'') || ' recebeu uma nova avaliação de ' || NEW.rating || ' estrela(s). Acesse o painel para ler e responder.',
    '/owner/empresa/' || NEW.company_id || '/dashboard',
    jsonb_build_object('company_id', NEW.company_id, 'review_id', NEW.id, 'rating', NEW.rating)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_owner_on_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_review();

-- 4) Trigger: owner replies -> notify reviewer
CREATE OR REPLACE FUNCTION public.notify_user_on_owner_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE company_name TEXT;
BEGIN
  IF NEW.owner_reply IS NULL THEN RETURN NEW; END IF;
  IF OLD.owner_reply IS NOT DISTINCT FROM NEW.owner_reply THEN RETURN NEW; END IF;
  SELECT name INTO company_name FROM public.companies WHERE id = NEW.company_id;
  PERFORM public.create_notification(
    NEW.user_id,
    'review_reply',
    'O dono respondeu sua avaliação',
    'A empresa ' || COALESCE(company_name,'') || ' respondeu sua avaliação. Toque para ler a resposta completa.',
    '/empresa/' || NEW.company_id,
    jsonb_build_object('company_id', NEW.company_id, 'review_id', NEW.id)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_user_on_owner_reply
AFTER UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_owner_reply();

-- 5) Trigger: claim status change -> notify claimant
CREATE OR REPLACE FUNCTION public.notify_on_claim_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE company_name TEXT; title TEXT; message TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  SELECT name INTO company_name FROM public.companies WHERE id = NEW.company_id;
  IF NEW.status = 'approved' THEN
    title := 'Reivindicação aprovada';
    message := 'Parabéns! Sua solicitação de reivindicação da empresa ' || COALESCE(company_name,'') || ' foi aprovada. Agora você já pode editar as informações, adicionar fotos e responder avaliações no seu painel.';
  ELSIF NEW.status = 'rejected' THEN
    title := 'Reivindicação não aprovada';
    message := 'Sua solicitação de reivindicação da empresa ' || COALESCE(company_name,'') || ' não foi aprovada desta vez. Verifique se os documentos enviados comprovam o vínculo com o negócio e tente novamente.';
  ELSE
    RETURN NEW;
  END IF;
  PERFORM public.create_notification(
    NEW.user_id,
    'claim_' || NEW.status,
    title,
    message,
    '/owner',
    jsonb_build_object('company_id', NEW.company_id, 'claim_id', NEW.id, 'status', NEW.status)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_claim_status
AFTER UPDATE ON public.company_claims
FOR EACH ROW EXECUTE FUNCTION public.notify_on_claim_status();

-- 6) Trigger: company approved/rejected -> notify owner
CREATE OR REPLACE FUNCTION public.notify_on_company_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE title TEXT; message TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status = 'approved' THEN
    title := 'Empresa aprovada e publicada';
    message := 'Sua empresa ' || NEW.name || ' acaba de ser aprovada e já está visível para todos os usuários. Aproveite para completar o cadastro: adicione logo, fotos, descrição detalhada e horário de funcionamento para atrair mais clientes.';
  ELSIF NEW.status = 'rejected' THEN
    title := 'Cadastro não aprovado';
    message := 'O cadastro da empresa ' || NEW.name || ' não foi aprovado. Revise as informações fornecidas, especialmente endereço, contato e descrição, e envie novamente. Em caso de dúvida, entre em contato com nosso suporte.';
  ELSE
    RETURN NEW;
  END IF;
  PERFORM public.create_notification(
    NEW.owner_id,
    'company_' || NEW.status,
    title,
    message,
    '/owner/empresa/' || NEW.id || '/dashboard',
    jsonb_build_object('company_id', NEW.id, 'status', NEW.status)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_company_status
AFTER UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.notify_on_company_status();
