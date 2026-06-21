GRANT SELECT, INSERT, UPDATE, DELETE ON public.two_fa_email_otp TO authenticated;
GRANT ALL ON public.two_fa_email_otp TO service_role;
ALTER TABLE public.two_fa_email_otp ENABLE ROW LEVEL SECURITY;
-- No client-side policies: table is read/written only via SECURITY DEFINER server functions using service role.