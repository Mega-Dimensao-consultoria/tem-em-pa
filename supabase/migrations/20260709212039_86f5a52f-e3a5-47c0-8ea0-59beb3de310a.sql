
-- 1) blog_categories
CREATE TABLE public.blog_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active blog categories"
  ON public.blog_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage blog categories"
  ON public.blog_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER blog_categories_set_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) blog_posts
CREATE TABLE public.blog_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  excerpt          text,
  content_html     text NOT NULL DEFAULT '',
  cover_image_url  text,
  author_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id      uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','published','archived')),
  published_at     timestamptz,
  reading_minutes  int NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_status_pub_idx
  ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_posts_category_idx
  ON public.blog_posts (category_id);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

CREATE POLICY "Admins read all blog posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Slug automático + reading_minutes automático + published_at fallback
CREATE OR REPLACE FUNCTION public.blog_posts_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_text text;
  v_words int;
  v_base_slug text;
  v_slug text;
  v_i int := 1;
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    v_base_slug := public.slugify(NEW.title);
    IF v_base_slug IS NULL OR length(v_base_slug) = 0 THEN
      v_base_slug := 'post';
    END IF;
    v_slug := v_base_slug;
    WHILE EXISTS (
      SELECT 1 FROM public.blog_posts
       WHERE slug = v_slug AND id <> COALESCE(NEW.id, gen_random_uuid())
    ) LOOP
      v_i := v_i + 1;
      v_slug := v_base_slug || '-' || v_i;
    END LOOP;
    NEW.slug := v_slug;
  END IF;

  v_text := regexp_replace(COALESCE(NEW.content_html, ''), '<[^>]+>', ' ', 'g');
  v_text := regexp_replace(v_text, '\s+', ' ', 'g');
  v_words := array_length(regexp_split_to_array(trim(v_text), '\s+'), 1);
  IF v_words IS NULL OR v_words = 0 THEN
    NEW.reading_minutes := 1;
  ELSE
    NEW.reading_minutes := GREATEST(1, ceil(v_words::numeric / 200)::int);
  END IF;

  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_before_write
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_posts_before_write();
