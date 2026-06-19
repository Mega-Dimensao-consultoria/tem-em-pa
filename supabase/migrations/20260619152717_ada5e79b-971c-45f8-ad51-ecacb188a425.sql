
-- 1. Fix runtime 500: allow anon to execute has_role (used by RLS policies on public tables)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- 2. Security fix: stop exposing phone numbers / emails of all profiles to anonymous visitors
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
-- Owners (and admins via has_role) can still update; existing update policy untouched.

-- 3. Promote thadeuhenriquedosanjos@gmail.com to admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('f3c7015d-701a-48ba-87f8-af0af1a97f05', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Add columns needed for owner-completo: hours, social, gallery, geo
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS hours jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] DEFAULT '{}'::text[];
