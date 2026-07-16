
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.age_verification_status AS ENUM ('pending','approved','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.age_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.age_verification_status NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'ageverif',
  provider_reference TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS age_verifications_user_unique
  ON public.age_verifications(user_id);

CREATE INDEX IF NOT EXISTS age_verifications_provider_ref_idx
  ON public.age_verifications(provider_reference);

-- Grants (writes go through server functions using service_role)
GRANT SELECT ON public.age_verifications TO authenticated;
GRANT ALL ON public.age_verifications TO service_role;

-- RLS
ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own age verification"
  ON public.age_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER trg_age_verifications_updated_at
  BEFORE UPDATE ON public.age_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
