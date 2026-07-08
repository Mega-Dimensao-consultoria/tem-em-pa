-- Tighten access on profiles and banned_words.
-- The public SELECT policies were already removed; also revoke the base GRANTs
-- so anon cannot query these tables directly. Public profile data must go
-- through the SECURITY DEFINER RPC get_public_profile.

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.banned_words FROM anon, authenticated;
-- Keep service_role full access for triggers/moderation running as definer.
GRANT ALL ON public.banned_words TO service_role;
GRANT ALL ON public.profiles TO service_role;