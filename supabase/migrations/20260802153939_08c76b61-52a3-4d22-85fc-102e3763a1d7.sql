-- review-photos: UPDATE restrito à pasta do próprio usuário (ou admin)
CREATE POLICY "review-photos update own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'review-photos'
  AND (((storage.foldername(name))[1] = auth.uid()::text) OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  bucket_id = 'review-photos'
  AND (((storage.foldername(name))[1] = auth.uid()::text) OR public.has_role(auth.uid(), 'admin'::app_role))
);

-- review-photos: moderação por admin
CREATE POLICY "review-photos admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'review-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- product-images: override de moderação para admins
CREATE POLICY "product-images admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "product-images admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- product-images: leitura pública explícita (bucket público)
CREATE POLICY "product-images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- review-photos: leitura pública explícita (bucket público)
CREATE POLICY "review-photos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');