
CREATE OR REPLACE FUNCTION public.enforce_company_owner_update_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status       IS DISTINCT FROM OLD.status
  OR NEW.is_featured  IS DISTINCT FROM OLD.is_featured
  OR NEW.owner_id     IS DISTINCT FROM OLD.owner_id
  OR NEW.slug         IS DISTINCT FROM OLD.slug
  OR NEW.city_id      IS DISTINCT FROM OLD.city_id
  OR NEW.category_id  IS DISTINCT FROM OLD.category_id THEN
    RAISE EXCEPTION 'Owners cannot modify moderation-controlled fields';
  END IF;

  RETURN NEW;
END;
$function$;

-- Remove duplicated trigger (both fire the same function)
DROP TRIGGER IF EXISTS trg_companies_enforce_owner_update_scope ON public.companies;
