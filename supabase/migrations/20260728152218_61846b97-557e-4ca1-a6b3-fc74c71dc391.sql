ALTER TABLE public.site_seo_settings
  ADD COLUMN IF NOT EXISTS adsense_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adsense_client_id text,
  ADD COLUMN IF NOT EXISTS adsense_head_snippet text,
  ADD COLUMN IF NOT EXISTS adsense_body_snippet text;

UPDATE public.site_seo_settings
  SET adsense_enabled = true,
      adsense_client_id = COALESCE(adsense_client_id, 'ca-pub-2966465320218096')
  WHERE id = 1;