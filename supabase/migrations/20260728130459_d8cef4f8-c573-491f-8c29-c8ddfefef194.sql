DROP INDEX IF EXISTS public.companies_name_unaccent_btree_idx;
CREATE INDEX companies_name_unaccent_btree_idx
  ON public.companies (public.immutable_unaccent(lower(name)) text_pattern_ops)
  INCLUDE (id)
  WHERE status = 'approved';