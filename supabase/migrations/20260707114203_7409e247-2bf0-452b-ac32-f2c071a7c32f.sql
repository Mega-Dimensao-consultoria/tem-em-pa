CREATE POLICY "site-pages-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-pages-images');

CREATE POLICY "site-pages-images admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-pages-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "site-pages-images admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-pages-images' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'site-pages-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "site-pages-images admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-pages-images' AND public.has_role(auth.uid(), 'admin'::app_role));