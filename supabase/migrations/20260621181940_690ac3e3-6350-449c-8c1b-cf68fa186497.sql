
-- Public read on banned_words (used by client-side review moderation hints)
CREATE POLICY "Public can read banned words"
  ON public.banned_words
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Explicit public SELECT on public storage buckets
CREATE POLICY "Public can read company-logos"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'company-logos');

CREATE POLICY "Public can read product-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');
