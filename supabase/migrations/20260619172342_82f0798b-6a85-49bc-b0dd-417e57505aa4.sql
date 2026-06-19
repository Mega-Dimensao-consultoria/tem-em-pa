
-- Owner dashboard: views, whatsapp clicks, review replies

CREATE TABLE public.company_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view','whatsapp_click','phone_click','website_click','maps_click')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_events_company_type_created_idx ON public.company_events (company_id, event_type, created_at DESC);
GRANT SELECT, INSERT ON public.company_events TO anon, authenticated;
GRANT ALL ON public.company_events TO service_role;
ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert events"
  ON public.company_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner or admin can read events"
  ON public.company_events FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_events.company_id AND c.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

ALTER TABLE public.reviews
  ADD COLUMN owner_reply text,
  ADD COLUMN owner_reply_at timestamptz;

-- Owner can update only the owner_reply fields of reviews of their own companies
CREATE POLICY "Owner can reply to reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = reviews.company_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = reviews.company_id AND c.owner_id = auth.uid())
  );
