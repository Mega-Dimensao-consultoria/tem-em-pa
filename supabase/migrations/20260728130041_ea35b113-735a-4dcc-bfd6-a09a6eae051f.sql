CREATE INDEX IF NOT EXISTS companies_name_unaccent_btree_idx
  ON public.companies (public.immutable_unaccent(lower(name)) text_pattern_ops)
  WHERE status = 'approved';

ANALYZE public.companies;