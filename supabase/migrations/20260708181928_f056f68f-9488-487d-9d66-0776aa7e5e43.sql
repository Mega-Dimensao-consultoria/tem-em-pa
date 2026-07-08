-- Fix: prevent owners from escalating moderation-controlled columns on companies/reviews,
-- and restrict city_events column changes for non-admin owners.

-- 1) COMPANIES: wire the existing guard function as a BEFORE UPDATE trigger
DROP TRIGGER IF EXISTS trg_companies_enforce_owner_update_scope ON public.companies;
CREATE TRIGGER trg_companies_enforce_owner_update_scope
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.enforce_company_owner_update_scope();

-- 2) REVIEWS: wire the existing guards
DROP TRIGGER IF EXISTS trg_reviews_enforce_owner_reply_only ON public.reviews;
CREATE TRIGGER trg_reviews_enforce_owner_reply_only
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_reply_only();

DROP TRIGGER IF EXISTS trg_reviews_enforce_owner_reply_insert ON public.reviews;
CREATE TRIGGER trg_reviews_enforce_owner_reply_insert
BEFORE INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_reply_insert();

-- Existing moderation trigger (auto-set status based on banned words) on INSERT
DROP TRIGGER IF EXISTS trg_reviews_moderate ON public.reviews;
CREATE TRIGGER trg_reviews_moderate
BEFORE INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.moderate_review();

-- Photos limit + updated_at
DROP TRIGGER IF EXISTS trg_reviews_photos_limit ON public.reviews;
CREATE TRIGGER trg_reviews_photos_limit
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_photos_limit();

-- 3) CITY_EVENTS: enforce ownership + add column-scope guard for non-admin owners
DROP TRIGGER IF EXISTS trg_city_events_ownership ON public.city_events;
CREATE TRIGGER trg_city_events_ownership
BEFORE INSERT OR UPDATE ON public.city_events
FOR EACH ROW EXECUTE FUNCTION public.enforce_city_event_ownership();

DROP TRIGGER IF EXISTS trg_city_events_set_city_id ON public.city_events;
CREATE TRIGGER trg_city_events_set_city_id
BEFORE INSERT ON public.city_events
FOR EACH ROW EXECUTE FUNCTION public.city_events_set_city_id();

-- Restrict which columns non-admin owners may alter on city_events (curation-only fields reserved for admins)
CREATE OR REPLACE FUNCTION public.enforce_city_event_owner_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Owners cannot toggle event visibility (is_active is reserved for admin curation)';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_city_event_owner_update_scope() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_city_events_owner_update_scope ON public.city_events;
CREATE TRIGGER trg_city_events_owner_update_scope
BEFORE UPDATE ON public.city_events
FOR EACH ROW EXECUTE FUNCTION public.enforce_city_event_owner_update_scope();