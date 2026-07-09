
-- 1) Prevent review authors from changing status
CREATE OR REPLACE FUNCTION public.enforce_review_author_status_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id = auth.uid()
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Review authors cannot change moderation status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_author_status_scope ON public.reviews;
CREATE TRIGGER trg_enforce_review_author_status_scope
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_author_status_scope();

-- 2) Tighten owner update policy on companies with an explicit WITH CHECK that
--    also blocks self-approval / self-feature at the policy layer (belt and
--    suspenders alongside the existing enforce_company_owner_update_scope trigger).
DROP POLICY IF EXISTS "Owners update their companies" ON public.companies;
CREATE POLICY "Owners update their companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (
  owner_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      status = (SELECT c.status FROM public.companies c WHERE c.id = companies.id)
      AND is_featured = (SELECT c.is_featured FROM public.companies c WHERE c.id = companies.id)
    )
  )
);

-- 3) Remove broad SELECT policy that allowed listing all files in the public
--    blog-images bucket. Public URL access to public buckets is served by the
--    storage endpoint and does not depend on this RLS policy.
DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
