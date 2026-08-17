ALTER TABLE public.companies DISABLE TRIGGER trg_admin_alert_companies;
ALTER TABLE public.companies DISABLE TRIGGER trg_admin_stats_companies;
ALTER TABLE public.companies DISABLE TRIGGER trg_notify_on_company_delete;
ALTER TABLE public.companies DISABLE TRIGGER trg_notify_on_company_status;

DELETE FROM public.companies WHERE source = 'inep_escolas';

ALTER TABLE public.companies ENABLE TRIGGER trg_admin_alert_companies;
ALTER TABLE public.companies ENABLE TRIGGER trg_admin_stats_companies;
ALTER TABLE public.companies ENABLE TRIGGER trg_notify_on_company_delete;
ALTER TABLE public.companies ENABLE TRIGGER trg_notify_on_company_status;

SELECT public.admin_reseed_stats();