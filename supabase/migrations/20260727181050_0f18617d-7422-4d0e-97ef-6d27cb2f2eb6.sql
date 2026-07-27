-- 1) Categoria "Utilidade Pública"
INSERT INTO public.categories (name, slug, icon, sort_order)
SELECT 'Utilidade Pública', 'utilidade-publica', 'Landmark', 9999
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'utilidade-publica');

-- 2) Coluna source em companies para rastrear origem
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_companies_source ON public.companies (source);

COMMENT ON COLUMN public.companies.source IS
  'Origem do cadastro: manual | ibge_prefeituras | inep_escolas | cnes_saude';

-- 3) Seed de prefeituras — uma por município ativo, sem endereço
WITH cat AS (
  SELECT id FROM public.categories WHERE slug = 'utilidade-publica' LIMIT 1
)
INSERT INTO public.companies (
  name,
  slug,
  city_id,
  category_id,
  status,
  source,
  description,
  owner_id
)
SELECT
  'Prefeitura Municipal de ' || c.name,
  public.slugify('prefeitura-municipal-' || c.name || '-' || c.state),
  c.id,
  (SELECT id FROM cat),
  'approved'::company_status,
  'ibge_prefeituras',
  'Sede do poder executivo municipal de ' || c.name || '/' || c.state ||
    '. Endereço e contato serão atualizados posteriormente pela moderação ou pelo próprio órgão.',
  NULL
FROM public.cities c
WHERE c.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.companies co
    WHERE co.city_id = c.id AND co.source = 'ibge_prefeituras'
  );