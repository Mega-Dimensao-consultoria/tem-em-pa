
-- Funções internas: sem acesso a anon; algumas restritas apenas ao sistema
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.slugify(text) FROM anon, PUBLIC;

-- Autenticado apenas (bloqueia anon)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_or_create_neighborhood(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reply_to_review(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_reviews() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_company_reviews_for_owner(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_resolve_review_report(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_merge_companies(uuid, uuid) FROM anon, PUBLIC;
