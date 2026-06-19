
-- 1) companies: hide sensitive contact columns from anon
REVOKE SELECT (email, phone, whatsapp) ON public.companies FROM anon;
GRANT SELECT (id, name, description, cep, address, number, complement, neighborhood, city, state, lat, lng, website, instagram_url, facebook_url, hours, gallery_urls, logo_url, cover_url, status, owner_id, is_featured, category_id, created_at, updated_at, slug) ON public.companies TO anon;

-- 2) profiles: restrict SELECT to self + admin
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3) user_roles: explicit restrictive insert/update/delete policies (admins only)
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) banned_words: ensure read happens through trigger (SECURITY DEFINER) so policy stays admin-only.
CREATE OR REPLACE FUNCTION public.moderate_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE bad_hit INT;
BEGIN
  IF NEW.comment IS NULL OR length(trim(NEW.comment)) = 0 THEN
    NEW.status = 'approved';
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO bad_hit FROM public.banned_words
    WHERE position(lower(word) in lower(NEW.comment)) > 0;
  IF bad_hit > 0 THEN
    NEW.status = 'pending_moderation';
  ELSE
    NEW.status = 'approved';
  END IF;
  RETURN NEW;
END; $function$;

-- 5) company_events: only authenticated users may insert
DROP POLICY IF EXISTS "Anyone can insert events for existing company" ON public.company_events;
CREATE POLICY "Authenticated insert events for existing company" ON public.company_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_events.company_id));
REVOKE INSERT ON public.company_events FROM anon;

-- 6) reviews: restrict owner UPDATE to only owner_reply / owner_reply_at via trigger
CREATE OR REPLACE FUNCTION public.enforce_owner_reply_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE is_author boolean; is_admin boolean; is_owner boolean;
BEGIN
  is_author := (NEW.user_id = auth.uid());
  is_admin  := public.has_role(auth.uid(), 'admin'::app_role);
  IF is_author OR is_admin THEN RETURN NEW; END IF;
  is_owner := EXISTS (SELECT 1 FROM public.companies c WHERE c.id = NEW.company_id AND c.owner_id = auth.uid());
  IF is_owner THEN
    IF NEW.rating       IS DISTINCT FROM OLD.rating
    OR NEW.comment      IS DISTINCT FROM OLD.comment
    OR NEW.status       IS DISTINCT FROM OLD.status
    OR NEW.is_anonymous IS DISTINCT FROM OLD.is_anonymous
    OR NEW.user_id      IS DISTINCT FROM OLD.user_id
    OR NEW.company_id   IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'Owners may only modify reply fields on reviews';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_enforce_owner_reply_only ON public.reviews;
CREATE TRIGGER trg_enforce_owner_reply_only
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_reply_only();

-- 7) Revoke EXECUTE on SECURITY DEFINER helpers from public roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) FROM anon, authenticated, public;
-- has_role is still callable from RLS policies and SECURITY DEFINER functions (owner privileges).

-- 8) Public buckets: stop allowing anon listing. Direct public URLs still work for public buckets.
DROP POLICY IF EXISTS "company-logos public read" ON storage.objects;

CREATE POLICY "company-logos authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company-logos');
