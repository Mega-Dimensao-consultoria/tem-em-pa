CREATE OR REPLACE FUNCTION public.enforce_city_event_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  v_owns_target boolean;
  v_company_approved boolean;
BEGIN
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'city_events.company_id cannot be changed';
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = NEW.company_id
      AND c.owner_id = auth.uid()
  ) INTO v_owns_target;

  IF NOT v_owns_target THEN
    RAISE EXCEPTION 'You cannot create or modify events for a company you do not own';
  END IF;

  SELECT (c.status = 'approved'::company_status)
    INTO v_company_approved
    FROM public.companies c
   WHERE c.id = NEW.company_id;

  -- Events of companies that are not approved can never be staged as active.
  IF TG_OP = 'INSERT' AND NOT COALESCE(v_company_approved, false) THEN
    NEW.is_active := false;
  END IF;

  RETURN NEW;
END;
$$;