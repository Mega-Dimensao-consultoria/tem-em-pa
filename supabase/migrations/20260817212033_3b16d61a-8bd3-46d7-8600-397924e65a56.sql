
-- Final security hardening adjustments
ALTER FUNCTION public.check_email_dlq_health() SET search_path = public, pgmq, extensions;

-- Re-verify and document public access functions (essential for site operation)
-- search_companies_autocomplete: needed for global search
-- has_role: needed for RLS policies and frontend UI logic
-- list_active_states / list_active_cities_by_state: needed for location navigation
GRANT EXECUTE ON FUNCTION public.search_companies_autocomplete(text, uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_active_states() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_active_cities_by_state(text) TO anon, authenticated;
