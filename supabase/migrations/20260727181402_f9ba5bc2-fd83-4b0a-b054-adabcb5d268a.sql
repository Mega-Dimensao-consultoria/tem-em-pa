ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS external_id text;

COMMENT ON COLUMN public.companies.external_id IS
  'Código externo da origem: INEP (escolas) ou CNES (saúde). Nulo para cadastros manuais/prefeituras.';

-- Deduplicação: não permite duas linhas com o mesmo (source, external_id)
CREATE UNIQUE INDEX IF NOT EXISTS companies_source_external_id_uniq
  ON public.companies (source, external_id)
  WHERE external_id IS NOT NULL;