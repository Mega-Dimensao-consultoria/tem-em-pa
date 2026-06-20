-- 1. push_subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own push subs" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own push subs" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own push subs" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own push subs" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. app_settings (internal config)
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role and SECURITY DEFINER functions can read.

INSERT INTO public.app_settings (key, value) VALUES
  ('push_dispatch_url', 'https://project--ca223581-f3bd-4d20-a399-1dd2e3a0e3dd.lovable.app/api/public/push/dispatch'),
  ('push_dispatch_secret', 'cd1944f02493186825efc4e80664b0612543f56eede90d8fc028b68aaf1d4b76')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 3. enable pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. trigger: chama o endpoint de dispatch depois de inserir notification
CREATE OR REPLACE FUNCTION public.dispatch_push_for_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dispatch_url text;
  dispatch_secret text;
BEGIN
  SELECT value INTO dispatch_url FROM public.app_settings WHERE key = 'push_dispatch_url';
  SELECT value INTO dispatch_secret FROM public.app_settings WHERE key = 'push_dispatch_secret';
  IF dispatch_url IS NULL OR dispatch_secret IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-dispatch-secret', dispatch_secret
    ),
    body := jsonb_build_object('notification_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE TRIGGER dispatch_push_after_notification
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_for_notification();