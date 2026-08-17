ALTER TABLE public.neighborhoods DISABLE TRIGGER trg_admin_stats_neighborhoods;

DELETE FROM public.neighborhoods n
WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.neighborhood_id = n.id);

ALTER TABLE public.neighborhoods ENABLE TRIGGER trg_admin_stats_neighborhoods;

SELECT public.admin_reseed_stats();