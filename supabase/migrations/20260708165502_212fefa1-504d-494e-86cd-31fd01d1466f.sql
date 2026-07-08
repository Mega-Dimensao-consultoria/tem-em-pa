-- Drop redundant/unused columns
ALTER TABLE public.companies DROP COLUMN IF EXISTS state;
ALTER TABLE public.cities DROP COLUMN IF EXISTS bbox_min_lat, DROP COLUMN IF EXISTS bbox_min_lng, DROP COLUMN IF EXISTS bbox_max_lat, DROP COLUMN IF EXISTS bbox_max_lng, DROP COLUMN IF EXISTS is_default;

-- Wipe legacy notification/push data (no active users, links point to old routes)
TRUNCATE TABLE public.notifications;
TRUNCATE TABLE public.push_subscriptions;