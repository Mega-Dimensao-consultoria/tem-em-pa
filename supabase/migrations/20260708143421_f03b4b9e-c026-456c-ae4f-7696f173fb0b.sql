
-- Extensão para busca sem acento (idempotente)
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- 1) FULL-TEXT SEARCH
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS search_tsv tsvector;

CREATE OR REPLACE FUNCTION public.companies_search_tsv_refresh()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE cat_name text;
BEGIN
  SELECT name INTO cat_name FROM public.categories WHERE id = NEW.category_id;
  NEW.search_tsv :=
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(NEW.name,''))), 'A') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(cat_name,''))), 'B') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(NEW.neighborhood,''))), 'C') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(NEW.description,''))), 'D');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS companies_search_tsv_trigger ON public.companies;
CREATE TRIGGER companies_search_tsv_trigger
  BEFORE INSERT OR UPDATE OF name, description, neighborhood, category_id
  ON public.companies FOR EACH ROW EXECUTE FUNCTION public.companies_search_tsv_refresh();

UPDATE public.companies SET name = name;

CREATE INDEX IF NOT EXISTS companies_search_tsv_idx ON public.companies USING GIN (search_tsv);

CREATE OR REPLACE FUNCTION public.search_companies_autocomplete(q text, lim int DEFAULT 8)
RETURNS TABLE(id uuid, name text, slug text, neighborhood text, logo_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT c.id, c.name, c.slug, c.neighborhood, c.logo_url
  FROM public.companies c
  WHERE c.status = 'approved'
    AND (
      c.search_tsv @@ websearch_to_tsquery('portuguese', extensions.unaccent(q))
      OR extensions.unaccent(lower(c.name)) LIKE extensions.unaccent(lower(q)) || '%'
    )
  ORDER BY
    ts_rank(c.search_tsv, websearch_to_tsquery('portuguese', extensions.unaccent(q))) DESC,
    c.is_featured DESC, c.name ASC
  LIMIT LEAST(GREATEST(lim, 1), 20);
$$;
GRANT EXECUTE ON FUNCTION public.search_companies_autocomplete(text, int) TO anon, authenticated;

-- 2) CMS preview token
ALTER TABLE public.site_pages_versions
  ADD COLUMN IF NOT EXISTS preview_token uuid UNIQUE DEFAULT gen_random_uuid();
UPDATE public.site_pages_versions SET preview_token = gen_random_uuid() WHERE preview_token IS NULL;

DROP POLICY IF EXISTS "Public can read a version by preview token" ON public.site_pages_versions;
CREATE POLICY "Public can read a version by preview token"
  ON public.site_pages_versions FOR SELECT TO anon, authenticated
  USING (preview_token IS NOT NULL);
GRANT SELECT ON public.site_pages_versions TO anon;

-- 3) Fotos em reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}'::text[];

CREATE OR REPLACE FUNCTION public.enforce_review_photos_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 3 THEN
    RAISE EXCEPTION 'Máximo de 3 fotos por avaliação';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS reviews_photos_limit ON public.reviews;
CREATE TRIGGER reviews_photos_limit
  BEFORE INSERT OR UPDATE OF photos ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_photos_limit();

-- 4) Perfil público
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio text;

CREATE OR REPLACE FUNCTION public.validate_profile_handle()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.handle IS NOT NULL THEN
    NEW.handle := lower(NEW.handle);
    IF NEW.handle !~ '^[a-z0-9_]{3,24}$' THEN
      RAISE EXCEPTION 'Handle inválido: use 3–24 caracteres (a-z, 0-9, _)';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS profiles_handle_validate ON public.profiles;
CREATE TRIGGER profiles_handle_validate
  BEFORE INSERT OR UPDATE OF handle ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_handle();

DROP POLICY IF EXISTS "Public profiles readable by anyone" ON public.profiles;
CREATE POLICY "Public profiles readable by anyone"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (is_public = true AND handle IS NOT NULL);
GRANT SELECT ON public.profiles TO anon;

CREATE OR REPLACE FUNCTION public.get_public_profile(_handle text)
RETURNS TABLE(id uuid, full_name text, avatar_url text, bio text, handle text, review_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.bio, p.handle,
    (SELECT count(*) FROM public.reviews r WHERE r.user_id = p.id AND r.status = 'approved' AND r.is_anonymous = false)
  FROM public.profiles p
  WHERE p.handle = lower(_handle) AND p.is_public = true;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_profile_reviews(_handle text, lim int DEFAULT 20)
RETURNS TABLE(id uuid, rating smallint, comment text, created_at timestamptz, company_id uuid, company_name text, company_slug text, photos text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.rating, r.comment, r.created_at, r.company_id, c.name, c.slug, r.photos
  FROM public.reviews r
  JOIN public.profiles p ON p.id = r.user_id AND p.handle = lower(_handle) AND p.is_public = true
  JOIN public.companies c ON c.id = r.company_id AND c.status = 'approved'
  WHERE r.status = 'approved' AND r.is_anonymous = false
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(lim, 1), 100);
$$;
GRANT EXECUTE ON FUNCTION public.get_public_profile_reviews(text, int) TO anon, authenticated;

-- 5) Ação de moderação de denúncias
CREATE OR REPLACE FUNCTION public.admin_resolve_review_report(_report_id uuid, _action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_review_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _action NOT IN ('approve','reject') THEN RAISE EXCEPTION 'invalid action'; END IF;
  SELECT review_id INTO v_review_id FROM public.review_reports WHERE id = _report_id;
  IF v_review_id IS NULL THEN RAISE EXCEPTION 'report not found'; END IF;
  IF _action = 'approve' THEN
    UPDATE public.reviews SET status = 'rejected' WHERE id = v_review_id;
    UPDATE public.review_reports SET status = 'approved', resolved_by = auth.uid(), resolved_at = now() WHERE id = _report_id;
  ELSE
    UPDATE public.review_reports SET status = 'rejected', resolved_by = auth.uid(), resolved_at = now() WHERE id = _report_id;
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_resolve_review_report(uuid, text) TO authenticated;

-- 6) Realtime em notifications
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7) Storage policies para review-photos
DROP POLICY IF EXISTS "review-photos read" ON storage.objects;
CREATE POLICY "review-photos read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'review-photos');
DROP POLICY IF EXISTS "review-photos upload own" ON storage.objects;
CREATE POLICY "review-photos upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "review-photos delete own" ON storage.objects;
CREATE POLICY "review-photos delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
