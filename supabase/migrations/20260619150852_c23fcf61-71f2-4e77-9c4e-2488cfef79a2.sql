
-- Storage policies for company-logos and product-images (public read, authenticated write own)
CREATE POLICY "Public read company-logos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'company-logos');
CREATE POLICY "Authenticated upload company-logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner update company-logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner delete company-logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated upload product-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner update product-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner delete product-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner read claim-documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'claim-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admin read claim-documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'claim-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated upload claim-documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'claim-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner delete claim-documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'claim-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
