
-- Register the dispatch URL for the notification-email webhook.
INSERT INTO public.app_settings (key, value) VALUES
  ('notification_email_dispatch_url',
   'https://project--ca223581-f3bd-4d20-a399-1dd2e3a0e3dd.lovable.app/api/public/hooks/notification-email')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Trigger function: fire an HTTP POST to the email dispatcher whenever a
-- notification is inserted with a type that maps to an email template.
CREATE OR REPLACE FUNCTION public.dispatch_email_for_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dispatch_url text;
  dispatch_secret text;
BEGIN
  IF NEW.type NOT IN (
    'review_new', 'review_reply',
    'company_approved', 'company_rejected',
    'claim_approved', 'claim_rejected'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT value INTO dispatch_url
    FROM public.app_settings WHERE key = 'notification_email_dispatch_url';
  SELECT value INTO dispatch_secret
    FROM public.app_settings WHERE key = 'push_dispatch_secret';

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

DROP TRIGGER IF EXISTS trg_dispatch_email_for_notification ON public.notifications;
CREATE TRIGGER trg_dispatch_email_for_notification
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_email_for_notification();
