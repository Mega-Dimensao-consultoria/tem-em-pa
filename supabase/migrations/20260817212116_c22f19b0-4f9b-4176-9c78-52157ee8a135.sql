
-- Cleanup residual EXECUTE permissions from PUBLIC that might be triggering the linter
-- Even if we revoked previously, some functions might still have '=' (PUBLIC) entries in their ACL.

DO $$ 
DECLARE 
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' 
          AND p.prosecdef = true 
          AND p.proname NOT IN ('has_role', 'get_public_profile', 'search_companies_autocomplete', 'list_active_states', 'list_active_cities_by_state')
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC', func_record.proname, func_record.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', func_record.proname, func_record.args);
    END LOOP;
END $$;

-- Specifically ensure these stay granted to users as they are part of the app logic
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_companies_autocomplete(text, uuid, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_active_states() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_active_cities_by_state(text) TO anon, authenticated, service_role;
