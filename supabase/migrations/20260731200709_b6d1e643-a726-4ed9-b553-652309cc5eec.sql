INSERT INTO public.app_settings (key, value)
VALUES ('company_moderation_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.apply_company_moderation_setting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean;
BEGIN
  -- Empresas criadas por admin ou via importação mantêm o status enviado.
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT lower(coalesce(value, 'true')) = 'true' INTO v_enabled
  FROM public.app_settings WHERE key = 'company_moderation_enabled';

  IF v_enabled IS NULL THEN
    v_enabled := true;
  END IF;

  IF NEW.status = 'pending' AND NOT v_enabled THEN
    NEW.status := 'approved';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_company_moderation ON public.companies;
CREATE TRIGGER trg_apply_company_moderation
BEFORE INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.apply_company_moderation_setting();

DROP POLICY IF EXISTS "Admins manage app settings" ON public.app_settings;
CREATE POLICY "Admins manage app settings"
ON public.app_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;