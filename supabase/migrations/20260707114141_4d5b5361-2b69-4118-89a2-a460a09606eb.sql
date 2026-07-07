CREATE TABLE IF NOT EXISTS public.site_pages_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL REFERENCES public.site_pages(slug) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  saved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.site_pages_versions TO authenticated;
GRANT ALL ON public.site_pages_versions TO service_role;

ALTER TABLE public.site_pages_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_pages_versions admin read"
  ON public.site_pages_versions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "site_pages_versions admin insert"
  ON public.site_pages_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "site_pages_versions admin delete"
  ON public.site_pages_versions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS site_pages_versions_slug_created_idx
  ON public.site_pages_versions (slug, created_at DESC);

-- Snapshot the previous state before every update so history is always complete.
CREATE OR REPLACE FUNCTION public.snapshot_site_page_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.title IS DISTINCT FROM OLD.title) OR (NEW.content_md IS DISTINCT FROM OLD.content_md) THEN
    INSERT INTO public.site_pages_versions (slug, title, content_md, saved_by)
    VALUES (OLD.slug, OLD.title, OLD.content_md, OLD.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_pages_snapshot ON public.site_pages;
CREATE TRIGGER trg_site_pages_snapshot
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_site_page_version();