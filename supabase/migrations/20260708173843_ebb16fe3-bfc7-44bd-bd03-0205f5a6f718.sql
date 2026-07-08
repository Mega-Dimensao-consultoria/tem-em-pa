
DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.relname);
  END LOOP;
END $$;

-- Public catalog tables readable by anonymous visitors
GRANT SELECT ON public.cities TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.neighborhoods TO anon;
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.city_events TO anon;
GRANT SELECT ON public.company_events TO anon;
GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT ON public.profiles TO anon;
