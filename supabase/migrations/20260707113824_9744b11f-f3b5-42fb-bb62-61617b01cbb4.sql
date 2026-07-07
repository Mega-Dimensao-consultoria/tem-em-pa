ALTER TABLE public.company_events ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.company_events DROP CONSTRAINT IF EXISTS company_events_source_check;
ALTER TABLE public.company_events ADD CONSTRAINT company_events_source_check CHECK (source IS NULL OR source IN ('direct','search','social','internal','other'));
CREATE INDEX IF NOT EXISTS company_events_source_idx ON public.company_events (company_id, source, created_at DESC);