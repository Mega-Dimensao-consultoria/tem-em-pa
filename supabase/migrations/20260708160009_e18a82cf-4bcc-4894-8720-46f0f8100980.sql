
-- ============================================================
-- 1) CITIES
-- ============================================================
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  state text NOT NULL,
  lat double precision,
  lng double precision,
  bbox_min_lat double precision,
  bbox_min_lng double precision,
  bbox_max_lat double precision,
  bbox_max_lng double precision,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  hero_headline text,
  hero_subheadline text,
  search_placeholder text,
  og_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active cities"
  ON public.cities FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage cities"
  ON public.cities FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER cities_set_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX cities_only_one_default
  ON public.cities ((is_default)) WHERE is_default = true;

-- ============================================================
-- 2) NEIGHBORHOODS
-- ============================================================
CREATE TABLE public.neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  lat double precision,
  lng double precision,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);

CREATE INDEX neighborhoods_city_id_idx ON public.neighborhoods(city_id);
CREATE INDEX neighborhoods_city_slug_idx ON public.neighborhoods(city_id, slug);

GRANT SELECT ON public.neighborhoods TO anon, authenticated;
GRANT INSERT ON public.neighborhoods TO authenticated;
GRANT ALL ON public.neighborhoods TO service_role;

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active neighborhoods"
  ON public.neighborhoods FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can propose neighborhoods"
  ON public.neighborhoods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage neighborhoods"
  ON public.neighborhoods FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER neighborhoods_set_updated_at
  BEFORE UPDATE ON public.neighborhoods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3) slug helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT regexp_replace(
    regexp_replace(
      lower(extensions.unaccent(coalesce(input, ''))),
      '[^a-z0-9]+', '-', 'g'
    ),
    '(^-+|-+$)', '', 'g'
  );
$$;

-- ============================================================
-- 4) Seed cities
-- ============================================================
INSERT INTO public.cities (name, slug, state, lat, lng, is_default, hero_headline, hero_subheadline, search_placeholder) VALUES
  ('Pouso Alegre',    'pouso-alegre',    'MG', -22.2306, -45.9364, true,  'O melhor de Pouso Alegre está pertinho de você.',    'Restaurantes, mercados, serviços e muito mais em Pouso Alegre/MG.',    'Buscar empresas em Pouso Alegre…'),
  ('São Paulo',       'sao-paulo',       'SP', -23.5505, -46.6333, false, 'O melhor de São Paulo está pertinho de você.',       'Restaurantes, mercados, serviços e muito mais em São Paulo/SP.',       'Buscar empresas em São Paulo…'),
  ('Rio de Janeiro',  'rio-de-janeiro',  'RJ', -22.9068, -43.1729, false, 'O melhor do Rio de Janeiro está pertinho de você.',  'Restaurantes, mercados, serviços e muito mais no Rio de Janeiro/RJ.',  'Buscar empresas no Rio de Janeiro…'),
  ('Belo Horizonte',  'belo-horizonte',  'MG', -19.9167, -43.9345, false, 'O melhor de Belo Horizonte está pertinho de você.',  'Restaurantes, mercados, serviços e muito mais em Belo Horizonte/MG.',  'Buscar empresas em Belo Horizonte…'),
  ('Vitória',         'vitoria',         'ES', -20.3155, -40.3128, false, 'O melhor de Vitória está pertinho de você.',         'Restaurantes, mercados, serviços e muito mais em Vitória/ES.',         'Buscar empresas em Vitória…');

-- ============================================================
-- 5) Backfill neighborhoods from current companies
-- ============================================================
INSERT INTO public.neighborhoods (city_id, name, slug, is_active)
SELECT
  (SELECT id FROM public.cities WHERE slug = 'pouso-alegre') AS city_id,
  trim(c.neighborhood) AS name,
  public.slugify(c.neighborhood) AS slug,
  true
FROM (
  SELECT DISTINCT neighborhood
  FROM public.companies
  WHERE neighborhood IS NOT NULL AND trim(neighborhood) <> ''
) c
ON CONFLICT (city_id, slug) DO NOTHING;

-- ============================================================
-- 6) COMPANIES — add columns, backfill, drop trigger, drop legacy cols, rebuild trigger
-- ============================================================
ALTER TABLE public.companies
  ADD COLUMN city_id uuid REFERENCES public.cities(id),
  ADD COLUMN neighborhood_id uuid REFERENCES public.neighborhoods(id);

UPDATE public.companies
SET city_id = (SELECT id FROM public.cities WHERE slug = 'pouso-alegre');

UPDATE public.companies c
SET neighborhood_id = n.id
FROM public.neighborhoods n
WHERE n.city_id = c.city_id
  AND n.slug = public.slugify(c.neighborhood);

ALTER TABLE public.companies
  ALTER COLUMN city_id SET NOT NULL;

-- Drop the tsv trigger so we can drop the legacy columns it references
DROP TRIGGER IF EXISTS companies_search_tsv_trigger ON public.companies;
DROP TRIGGER IF EXISTS companies_tsv_refresh ON public.companies;

-- Drop legacy text columns
ALTER TABLE public.companies DROP COLUMN IF EXISTS city;
ALTER TABLE public.companies DROP COLUMN IF EXISTS neighborhood;

-- Slug: unique per city instead of global
DO $$
DECLARE cons record;
BEGIN
  FOR cons IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.companies'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(slug)%'
  LOOP
    EXECUTE format('ALTER TABLE public.companies DROP CONSTRAINT %I', cons.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS companies_slug_key;
DROP INDEX IF EXISTS companies_slug_idx;

CREATE UNIQUE INDEX companies_city_slug_unique
  ON public.companies(city_id, slug) WHERE slug IS NOT NULL;

CREATE INDEX companies_city_status_idx ON public.companies(city_id, status);
CREATE INDEX companies_neighborhood_id_idx ON public.companies(neighborhood_id);

-- Redefine the tsv function to use city/neighborhood joins
CREATE OR REPLACE FUNCTION public.companies_search_tsv_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  cat_name text;
  city_name text;
  neigh_name text;
BEGIN
  SELECT name INTO cat_name FROM public.categories WHERE id = NEW.category_id;
  SELECT name INTO city_name FROM public.cities WHERE id = NEW.city_id;
  SELECT name INTO neigh_name FROM public.neighborhoods WHERE id = NEW.neighborhood_id;
  NEW.search_tsv :=
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(NEW.name,''))), 'A') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(cat_name,''))), 'B') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(neigh_name,''))), 'C') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(city_name,''))), 'C') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(NEW.description,''))), 'D');
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_search_tsv_trigger
  BEFORE INSERT OR UPDATE OF name, description, category_id, city_id, neighborhood_id
  ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.companies_search_tsv_refresh();

-- Regenerate tsv for all existing rows
UPDATE public.companies SET updated_at = now();

-- ============================================================
-- 7) CITY_EVENTS — add city_id and sync trigger
-- ============================================================
ALTER TABLE public.city_events
  ADD COLUMN city_id uuid REFERENCES public.cities(id);

UPDATE public.city_events e
SET city_id = c.city_id
FROM public.companies c
WHERE c.id = e.company_id;

ALTER TABLE public.city_events
  ALTER COLUMN city_id SET NOT NULL;

CREATE INDEX city_events_city_active_starts_idx
  ON public.city_events(city_id, is_active, starts_at);

CREATE OR REPLACE FUNCTION public.city_events_set_city_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT city_id INTO NEW.city_id FROM public.companies WHERE id = NEW.company_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER city_events_sync_city
  BEFORE INSERT OR UPDATE OF company_id ON public.city_events
  FOR EACH ROW EXECUTE FUNCTION public.city_events_set_city_id();

-- ============================================================
-- 8) PROFILES + SITE_PAGES
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN home_city_id uuid REFERENCES public.cities(id);

ALTER TABLE public.site_pages
  ADD COLUMN city_id uuid REFERENCES public.cities(id);

-- ============================================================
-- 9) Autocomplete RPC scoped by city
-- ============================================================
DROP FUNCTION IF EXISTS public.search_companies_autocomplete(text, integer);
CREATE OR REPLACE FUNCTION public.search_companies_autocomplete(
  q text,
  _city_id uuid,
  lim integer DEFAULT 8
)
RETURNS TABLE(id uuid, name text, slug text, neighborhood text, logo_url text, city_slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT c.id, c.name, c.slug, n.name AS neighborhood, c.logo_url, ci.slug AS city_slug
  FROM public.companies c
  LEFT JOIN public.neighborhoods n ON n.id = c.neighborhood_id
  LEFT JOIN public.cities ci ON ci.id = c.city_id
  WHERE c.status = 'approved'
    AND (_city_id IS NULL OR c.city_id = _city_id)
    AND (
      c.search_tsv @@ websearch_to_tsquery('portuguese', extensions.unaccent(q))
      OR extensions.unaccent(lower(c.name)) LIKE extensions.unaccent(lower(q)) || '%'
    )
  ORDER BY
    ts_rank(c.search_tsv, websearch_to_tsquery('portuguese', extensions.unaccent(q))) DESC,
    c.is_featured DESC, c.name ASC
  LIMIT LEAST(GREATEST(lim, 1), 20);
$$;
