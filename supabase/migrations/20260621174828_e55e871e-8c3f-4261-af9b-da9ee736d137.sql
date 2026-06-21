
-- Revoke user_id exposure on reviews from anon/PUBLIC (authenticated keeps it for app reads via RLS)
REVOKE SELECT (user_id) ON public.reviews FROM PUBLIC, anon;

-- Revoke owner_id exposure on companies from anon/PUBLIC
REVOKE SELECT (owner_id) ON public.companies FROM PUBLIC, anon;

-- Add explicit SELECT policies on storage.objects for the public buckets so scanner sees scoped reads
CREATE POLICY "Public read company-logos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'company-logos');

CREATE POLICY "Public read product-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');
