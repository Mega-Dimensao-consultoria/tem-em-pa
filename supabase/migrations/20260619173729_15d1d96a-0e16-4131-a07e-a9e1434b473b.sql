-- Policies on storage.objects for bucket "company-logos"
-- Path convention: {companyId}/logo.{ext} | {companyId}/cover.{ext} | {companyId}/gallery/{uuid}.{ext}

DROP POLICY IF EXISTS "company-logos public read" ON storage.objects;
DROP POLICY IF EXISTS "company-logos owner insert" ON storage.objects;
DROP POLICY IF EXISTS "company-logos owner update" ON storage.objects;
DROP POLICY IF EXISTS "company-logos owner delete" ON storage.objects;

CREATE POLICY "company-logos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "company-logos owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "company-logos owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "company-logos owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.owner_id = auth.uid()
    )
  )
);