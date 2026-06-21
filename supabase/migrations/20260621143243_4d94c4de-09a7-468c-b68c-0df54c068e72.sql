DO $$ BEGIN
  CREATE TYPE public.login_approval_status AS ENUM ('pending','approved','denied','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.login_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.login_approval_status NOT NULL DEFAULT 'pending',
  requester_ip text,
  requester_user_agent text,
  approved_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_approval_requests_user_idx
  ON public.login_approval_requests (user_id, created_at DESC);

GRANT SELECT, UPDATE ON public.login_approval_requests TO authenticated;
GRANT ALL ON public.login_approval_requests TO service_role;

ALTER TABLE public.login_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own approvals"
  ON public.login_approval_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "User updates own approvals"
  ON public.login_approval_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);