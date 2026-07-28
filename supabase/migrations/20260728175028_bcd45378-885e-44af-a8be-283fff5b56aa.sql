
-- 1) Cache table
CREATE TABLE public.admin_stats_cache (
  key text PRIMARY KEY,
  value bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_stats_cache TO authenticated;
GRANT ALL ON public.admin_stats_cache TO service_role;

ALTER TABLE public.admin_stats_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads stats cache"
ON public.admin_stats_cache FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed keys
INSERT INTO public.admin_stats_cache(key, value) VALUES
  ('companies_total', 0),
  ('companies_approved', 0),
  ('companies_pending', 0),
  ('companies_rejected', 0),
  ('reviews_total', 0),
  ('reviews_pending', 0),
  ('claims_pending', 0),
  ('removals_pending', 0),
  ('reports_pending', 0),
  ('contact_pending', 0),
  ('contact_total', 0),
  ('users_total', 0),
  ('blog_total', 0),
  ('blog_published', 0),
  ('pages_total', 0),
  ('cities_total', 0),
  ('neighborhoods_total', 0),
  ('categories_total', 0)
ON CONFLICT (key) DO NOTHING;

-- 2) Helper: bump a counter (avoids repeating UPDATE ... key = ...)
CREATE OR REPLACE FUNCTION public.admin_stats_bump(_key text, _delta int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.admin_stats_cache
     SET value = GREATEST(value + _delta, 0),
         updated_at = now()
   WHERE key = _key;
$$;

-- 3) Trigger fns per table
CREATE OR REPLACE FUNCTION public.admin_stats_companies_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ob text; nb text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.admin_stats_bump('companies_total', 1);
    nb := CASE WHEN NEW.status = 'approved' THEN 'companies_approved'
               WHEN NEW.status IN ('pending','claimed_pending') THEN 'companies_pending'
               WHEN NEW.status = 'rejected' THEN 'companies_rejected' END;
    IF nb IS NOT NULL THEN PERFORM public.admin_stats_bump(nb, 1); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.admin_stats_bump('companies_total', -1);
    ob := CASE WHEN OLD.status = 'approved' THEN 'companies_approved'
               WHEN OLD.status IN ('pending','claimed_pending') THEN 'companies_pending'
               WHEN OLD.status = 'rejected' THEN 'companies_rejected' END;
    IF ob IS NOT NULL THEN PERFORM public.admin_stats_bump(ob, -1); END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    ob := CASE WHEN OLD.status = 'approved' THEN 'companies_approved'
               WHEN OLD.status IN ('pending','claimed_pending') THEN 'companies_pending'
               WHEN OLD.status = 'rejected' THEN 'companies_rejected' END;
    nb := CASE WHEN NEW.status = 'approved' THEN 'companies_approved'
               WHEN NEW.status IN ('pending','claimed_pending') THEN 'companies_pending'
               WHEN NEW.status = 'rejected' THEN 'companies_rejected' END;
    IF ob IS NOT NULL THEN PERFORM public.admin_stats_bump(ob, -1); END IF;
    IF nb IS NOT NULL THEN PERFORM public.admin_stats_bump(nb, 1); END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stats_reviews_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ob text; nb text;
  fn_pending text := 'reviews_pending';
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.admin_stats_bump('reviews_total', 1);
    IF NEW.status IN ('pending_moderation','flagged') THEN
      PERFORM public.admin_stats_bump(fn_pending, 1);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.admin_stats_bump('reviews_total', -1);
    IF OLD.status IN ('pending_moderation','flagged') THEN
      PERFORM public.admin_stats_bump(fn_pending, -1);
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('pending_moderation','flagged') AND NEW.status NOT IN ('pending_moderation','flagged') THEN
      PERFORM public.admin_stats_bump(fn_pending, -1);
    ELSIF NEW.status IN ('pending_moderation','flagged') AND OLD.status NOT IN ('pending_moderation','flagged') THEN
      PERFORM public.admin_stats_bump(fn_pending, 1);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stats_pending_status_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket text := TG_ARGV[0];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' THEN PERFORM public.admin_stats_bump(bucket, 1); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'pending' THEN PERFORM public.admin_stats_bump(bucket, -1); END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'pending' AND NEW.status <> 'pending' THEN PERFORM public.admin_stats_bump(bucket, -1);
    ELSIF NEW.status = 'pending' AND OLD.status <> 'pending' THEN PERFORM public.admin_stats_bump(bucket, 1);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stats_contact_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.admin_stats_bump('contact_total', 1);
    IF NEW.status = 'pending' THEN PERFORM public.admin_stats_bump('contact_pending', 1); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.admin_stats_bump('contact_total', -1);
    IF OLD.status = 'pending' THEN PERFORM public.admin_stats_bump('contact_pending', -1); END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'pending' AND NEW.status <> 'pending' THEN PERFORM public.admin_stats_bump('contact_pending', -1);
    ELSIF NEW.status = 'pending' AND OLD.status <> 'pending' THEN PERFORM public.admin_stats_bump('contact_pending', 1);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stats_blog_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.admin_stats_bump('blog_total', 1);
    IF NEW.status = 'published' THEN PERFORM public.admin_stats_bump('blog_published', 1); END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.admin_stats_bump('blog_total', -1);
    IF OLD.status = 'published' THEN PERFORM public.admin_stats_bump('blog_published', -1); END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'published' AND NEW.status <> 'published' THEN PERFORM public.admin_stats_bump('blog_published', -1);
    ELSIF NEW.status = 'published' AND OLD.status <> 'published' THEN PERFORM public.admin_stats_bump('blog_published', 1);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stats_simple_count_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE bucket text := TG_ARGV[0];
BEGIN
  IF TG_OP = 'INSERT' THEN PERFORM public.admin_stats_bump(bucket, 1);
  ELSIF TG_OP = 'DELETE' THEN PERFORM public.admin_stats_bump(bucket, -1);
  END IF;
  RETURN NULL;
END;
$$;

-- 4) Wire triggers
DROP TRIGGER IF EXISTS trg_admin_stats_companies ON public.companies;
CREATE TRIGGER trg_admin_stats_companies
AFTER INSERT OR UPDATE OF status OR DELETE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_companies_trg();

DROP TRIGGER IF EXISTS trg_admin_stats_reviews ON public.reviews;
CREATE TRIGGER trg_admin_stats_reviews
AFTER INSERT OR UPDATE OF status OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_reviews_trg();

DROP TRIGGER IF EXISTS trg_admin_stats_claims ON public.company_claims;
CREATE TRIGGER trg_admin_stats_claims
AFTER INSERT OR UPDATE OF status OR DELETE ON public.company_claims
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_pending_status_trg('claims_pending');

DROP TRIGGER IF EXISTS trg_admin_stats_removals ON public.company_removal_requests;
CREATE TRIGGER trg_admin_stats_removals
AFTER INSERT OR UPDATE OF status OR DELETE ON public.company_removal_requests
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_pending_status_trg('removals_pending');

DROP TRIGGER IF EXISTS trg_admin_stats_reports ON public.review_reports;
CREATE TRIGGER trg_admin_stats_reports
AFTER INSERT OR UPDATE OF status OR DELETE ON public.review_reports
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_pending_status_trg('reports_pending');

DROP TRIGGER IF EXISTS trg_admin_stats_contact ON public.contact_messages;
CREATE TRIGGER trg_admin_stats_contact
AFTER INSERT OR UPDATE OF status OR DELETE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_contact_trg();

DROP TRIGGER IF EXISTS trg_admin_stats_blog ON public.blog_posts;
CREATE TRIGGER trg_admin_stats_blog
AFTER INSERT OR UPDATE OF status OR DELETE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_blog_trg();

DROP TRIGGER IF EXISTS trg_admin_stats_users ON public.profiles;
CREATE TRIGGER trg_admin_stats_users
AFTER INSERT OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_simple_count_trg('users_total');

DROP TRIGGER IF EXISTS trg_admin_stats_pages ON public.site_pages;
CREATE TRIGGER trg_admin_stats_pages
AFTER INSERT OR DELETE ON public.site_pages
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_simple_count_trg('pages_total');

DROP TRIGGER IF EXISTS trg_admin_stats_cities ON public.cities;
CREATE TRIGGER trg_admin_stats_cities
AFTER INSERT OR DELETE ON public.cities
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_simple_count_trg('cities_total');

DROP TRIGGER IF EXISTS trg_admin_stats_neighborhoods ON public.neighborhoods;
CREATE TRIGGER trg_admin_stats_neighborhoods
AFTER INSERT OR DELETE ON public.neighborhoods
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_simple_count_trg('neighborhoods_total');

DROP TRIGGER IF EXISTS trg_admin_stats_categories ON public.categories;
CREATE TRIGGER trg_admin_stats_categories
AFTER INSERT OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.admin_stats_simple_count_trg('categories_total');

-- 5) Reseed function — recalculates all keys from source of truth
CREATE OR REPLACE FUNCTION public.admin_reseed_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '5min'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.companies), updated_at = now() WHERE key = 'companies_total';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.companies WHERE status = 'approved'), updated_at = now() WHERE key = 'companies_approved';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.companies WHERE status IN ('pending','claimed_pending')), updated_at = now() WHERE key = 'companies_pending';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.companies WHERE status = 'rejected'), updated_at = now() WHERE key = 'companies_rejected';

  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.reviews), updated_at = now() WHERE key = 'reviews_total';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.reviews WHERE status IN ('pending_moderation','flagged')), updated_at = now() WHERE key = 'reviews_pending';

  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.company_claims WHERE status = 'pending'), updated_at = now() WHERE key = 'claims_pending';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.company_removal_requests WHERE status = 'pending'), updated_at = now() WHERE key = 'removals_pending';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.review_reports WHERE status = 'pending'), updated_at = now() WHERE key = 'reports_pending';

  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.contact_messages), updated_at = now() WHERE key = 'contact_total';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.contact_messages WHERE status = 'pending'), updated_at = now() WHERE key = 'contact_pending';

  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.profiles), updated_at = now() WHERE key = 'users_total';

  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.blog_posts), updated_at = now() WHERE key = 'blog_total';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.blog_posts WHERE status = 'published'), updated_at = now() WHERE key = 'blog_published';

  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.site_pages), updated_at = now() WHERE key = 'pages_total';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.cities), updated_at = now() WHERE key = 'cities_total';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.neighborhoods), updated_at = now() WHERE key = 'neighborhoods_total';
  UPDATE public.admin_stats_cache SET value = (SELECT count(*) FROM public.categories), updated_at = now() WHERE key = 'categories_total';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reseed_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_reseed_stats() TO authenticated;

-- 6) Initial seed with real counts
SELECT public.admin_reseed_stats();
