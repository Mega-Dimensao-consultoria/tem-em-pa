-- Renomeia a coluna legada content_md para content_html e atualiza funções relacionadas.

ALTER TABLE public.site_pages RENAME COLUMN content_md TO content_html;
ALTER TABLE public.site_pages_versions RENAME COLUMN content_md TO content_html;

CREATE OR REPLACE FUNCTION public.snapshot_site_page_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.title IS DISTINCT FROM OLD.title) OR (NEW.content_html IS DISTINCT FROM OLD.content_html) THEN
    INSERT INTO public.site_pages_versions (slug, title, content_html, saved_by)
    VALUES (OLD.slug, OLD.title, OLD.content_html, OLD.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.get_site_page_version_by_token(uuid);
CREATE OR REPLACE FUNCTION public.get_site_page_version_by_token(_token uuid)
RETURNS TABLE(slug text, title text, content_html text, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.slug, v.title, v.content_html, v.created_at
  FROM public.site_pages_versions v
  WHERE _token IS NOT NULL AND v.preview_token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_page_version_by_token(uuid) TO anon, authenticated;