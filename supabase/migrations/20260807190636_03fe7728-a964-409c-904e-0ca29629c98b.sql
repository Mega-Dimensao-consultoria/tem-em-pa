CREATE OR REPLACE FUNCTION public.enforce_owner_reply_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  is_owner boolean := EXISTS (
    SELECT 1 FROM public.companies c
     WHERE c.id = NEW.company_id AND c.owner_id = auth.uid()
  );
  reply_changed boolean := NEW.owner_reply IS DISTINCT FROM OLD.owner_reply
                        OR NEW.owner_reply_at IS DISTINCT FROM OLD.owner_reply_at;
  status_changed boolean := NEW.status IS DISTINCT FROM OLD.status;
  content_changed boolean := NEW.rating IS DISTINCT FROM OLD.rating
                          OR NEW.comment IS DISTINCT FROM OLD.comment
                          OR NEW.is_anonymous IS DISTINCT FROM OLD.is_anonymous
                          OR NEW.photos IS DISTINCT FROM OLD.photos;
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Identity columns are immutable for everyone but admins.
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Review ownership cannot be reassigned';
  END IF;

  -- Moderation status is admin-only (see moderate_review for automated flow).
  IF status_changed THEN
    RAISE EXCEPTION 'Only admins can change review moderation status';
  END IF;

  IF reply_changed AND NOT is_owner THEN
    RAISE EXCEPTION 'Only the company owner or an admin can change owner reply fields';
  END IF;

  IF is_owner AND NOT (NEW.user_id = auth.uid()) AND content_changed THEN
    RAISE EXCEPTION 'Owners may only modify reply fields on reviews';
  END IF;

  RETURN NEW;
END;
$function$;