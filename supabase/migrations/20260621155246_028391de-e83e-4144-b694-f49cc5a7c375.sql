DELETE FROM public.notifications WHERE type = 'login_approval';
DROP TABLE IF EXISTS public.login_approval_requests;
DROP TYPE IF EXISTS public.login_approval_status;