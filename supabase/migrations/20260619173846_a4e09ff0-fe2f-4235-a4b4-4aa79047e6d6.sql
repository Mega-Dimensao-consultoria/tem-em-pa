DROP POLICY IF EXISTS "company-logos public read" ON storage.objects;
DROP POLICY IF EXISTS "company-logos owner insert" ON storage.objects;
DROP POLICY IF EXISTS "company-logos owner update" ON storage.objects;
DROP POLICY IF EXISTS "company-logos owner delete" ON storage.objects;

CREATE POLICY "company-logos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "company-logos user insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "company-logos user update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "company-logos user delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);