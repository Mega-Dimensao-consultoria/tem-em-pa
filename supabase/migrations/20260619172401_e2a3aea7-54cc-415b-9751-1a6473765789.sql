
DROP POLICY "Anyone can insert events" ON public.company_events;
CREATE POLICY "Anyone can insert events for existing company"
  ON public.company_events FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_events.company_id));
