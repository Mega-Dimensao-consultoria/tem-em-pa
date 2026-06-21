
-- Email OTP fallback for 2FA
CREATE TABLE public.two_fa_email_otp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.two_fa_email_otp TO service_role;
ALTER TABLE public.two_fa_email_otp ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (server functions) may access.

-- Support requests to reset 2FA when user lost device and email access
CREATE TABLE public.two_fa_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','rejected')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.two_fa_reset_requests TO authenticated;
GRANT INSERT ON public.two_fa_reset_requests TO anon;
GRANT ALL ON public.two_fa_reset_requests TO service_role;
ALTER TABLE public.two_fa_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a reset request"
  ON public.two_fa_reset_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all reset requests"
  ON public.two_fa_reset_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reset requests"
  ON public.two_fa_reset_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX two_fa_reset_requests_status_idx ON public.two_fa_reset_requests(status, created_at DESC);

-- Fix the previously flagged finding: ensure user_id on reviews stays hidden from
-- non-owner/non-admin callers (column grants — re-apply idempotently).
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (
  id, company_id, rating, comment, status, is_anonymous,
  owner_reply, owner_reply_at, created_at, updated_at
) ON public.reviews TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO service_role;
