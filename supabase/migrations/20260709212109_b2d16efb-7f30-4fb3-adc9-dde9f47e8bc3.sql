
CREATE POLICY "Blog images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Admins upload blog images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins update blog images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins delete blog images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );
