
-- 1) site_pages_versions: drop broad public read; add SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Public can read a version by preview token" ON public.site_pages_versions;

CREATE OR REPLACE FUNCTION public.get_site_page_version_by_token(_token uuid)
RETURNS TABLE(slug text, title text, content_md text, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.slug, v.title, v.content_md, v.created_at
  FROM public.site_pages_versions v
  WHERE _token IS NOT NULL AND v.preview_token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_page_version_by_token(uuid) TO anon, authenticated;

-- 2) companies INSERT: force owner_id = auth.uid() and status = 'pending'
DROP POLICY IF EXISTS "Authenticated can submit companies" ON public.companies;
CREATE POLICY "Authenticated can submit companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
  AND status = 'pending'::company_status
);

-- 3) reviews: prevent author from setting owner_reply/owner_reply_at
CREATE OR REPLACE FUNCTION public.enforce_owner_reply_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE is_author boolean; is_admin boolean; is_owner boolean;
BEGIN
  is_author := (NEW.user_id = auth.uid());
  is_admin  := public.has_role(auth.uid(), 'admin'::app_role);
  is_owner  := EXISTS (SELECT 1 FROM public.companies c WHERE c.id = NEW.company_id AND c.owner_id = auth.uid());

  -- Author (and non-admin) may never change owner_reply / owner_reply_at directly.
  IF is_author AND NOT is_admin THEN
    IF NEW.owner_reply IS DISTINCT FROM OLD.owner_reply
       OR NEW.owner_reply_at IS DISTINCT FROM OLD.owner_reply_at THEN
      RAISE EXCEPTION 'Reviewers cannot modify owner reply fields';
    END IF;
    RETURN NEW;
  END IF;

  IF is_admin THEN RETURN NEW; END IF;

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
END; $function$;

-- 4) Storage: remove broad listing on public buckets
DROP POLICY IF EXISTS "review-photos read" ON storage.objects;
DROP POLICY IF EXISTS "site-pages-images public read" ON storage.objects;
