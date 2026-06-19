-- Revoke column-level SELECT on sensitive contact fields from anon.
-- Authenticated users still see them (business rule: directory is public, contact requires login).
REVOKE SELECT (email, phone, whatsapp) ON public.companies FROM anon;