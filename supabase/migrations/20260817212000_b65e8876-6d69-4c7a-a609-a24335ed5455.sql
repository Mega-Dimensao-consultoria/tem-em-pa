
-- Security Hardening Migration
-- Addresses 74 linter warnings related to search_path and EXECUTE permissions.

-- 1. Fix search_path for all SECURITY DEFINER functions in public schema
ALTER FUNCTION public.trg_update_products_stats() SET search_path = public;
ALTER FUNCTION public.retry_pending_emails() SET search_path = public, pgmq;
ALTER FUNCTION public.email_queue_dispatch() SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.email_queue_wake() SET search_path = public, pgmq;
ALTER FUNCTION public.purge_email_dlq() SET search_path = public, pgmq;
ALTER FUNCTION public.retry_email_dlq() SET search_path = public, pgmq;
ALTER FUNCTION public.purge_email_queue() SET search_path = public, pgmq;

-- 2. Restrict EXECUTE permissions on sensitive administrative functions
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
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', func_record.proname, func_record.args);
    END LOOP;
END $$;

-- Specifically grant EXECUTE only to necessary roles for specific functions
GRANT EXECUTE ON FUNCTION public.admin_reseed_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_stats_bump(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.retry_pending_emails() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_email_queue() TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_email_dlq() TO service_role;
GRANT EXECUTE ON FUNCTION public.retry_email_dlq() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) TO authenticated, service_role;

-- 3. Ensure Table Grants are correct
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
GRANT SELECT ON public.admin_stats_cache TO authenticated;
GRANT ALL ON public.admin_stats_cache TO service_role;
