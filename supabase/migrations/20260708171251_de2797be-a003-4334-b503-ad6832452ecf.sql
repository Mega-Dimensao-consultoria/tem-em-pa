-- 1) Companies: block owner from changing moderation-only fields on UPDATE.
CREATE OR REPLACE FUNCTION public.enforce_company_owner_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status       IS DISTINCT FROM OLD.status
  OR NEW.is_featured  IS DISTINCT FROM OLD.is_featured
  OR NEW.is_verified  IS DISTINCT FROM OLD.is_verified
  OR NEW.owner_id     IS DISTINCT FROM OLD.owner_id
  OR NEW.slug         IS DISTINCT FROM OLD.slug
  OR NEW.city_id      IS DISTINCT FROM OLD.city_id
  OR NEW.category_id  IS DISTINCT FROM OLD.category_id THEN
    RAISE EXCEPTION 'Owners cannot modify moderation-controlled fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_company_owner_update_scope ON public.companies;
CREATE TRIGGER trg_enforce_company_owner_update_scope
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.enforce_company_owner_update_scope();

-- 2) Reviews: also enforce owner-only reply on INSERT (existing trigger covers UPDATE).
CREATE OR REPLACE FUNCTION public.enforce_owner_reply_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  is_owner boolean := EXISTS (
    SELECT 1 FROM public.companies c
     WHERE c.id = NEW.company_id AND c.owner_id = auth.uid()
  );
BEGIN
  IF (NEW.owner_reply IS NOT NULL OR NEW.owner_reply_at IS NOT NULL)
     AND NOT (is_admin OR is_owner) THEN
    RAISE EXCEPTION 'Only the company owner or an admin can set owner_reply';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_owner_reply_insert ON public.reviews;
CREATE TRIGGER trg_enforce_owner_reply_insert
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_reply_insert();