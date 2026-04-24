-- Analytics events table
CREATE TYPE public.analytics_event_type AS ENUM (
  'product_view',
  'page_view',
  'marketplace_click',
  'banner_view',
  'banner_click',
  'search_query',
  'newsletter_signup',
  'favorite_add'
);

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.analytics_event_type NOT NULL,
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  banner_id uuid NULL REFERENCES public.banners(id) ON DELETE SET NULL,
  value text NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id text NULL,
  user_id uuid NULL,
  path text NULL,
  referrer text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_type_created ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX idx_analytics_events_product ON public.analytics_events (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_analytics_events_banner ON public.analytics_events (banner_id) WHERE banner_id IS NOT NULL;
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous tracking allowed)
CREATE POLICY "Analytics: public insert"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (value IS NULL OR length(value) <= 500)
    AND (path IS NULL OR length(path) <= 500)
    AND (referrer IS NULL OR length(referrer) <= 1000)
    AND (user_agent IS NULL OR length(user_agent) <= 500)
    AND (session_id IS NULL OR length(session_id) <= 100)
  );

-- Only admins/editors can read
CREATE POLICY "Analytics: editors read"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Only admins can delete
CREATE POLICY "Analytics: admin delete"
  ON public.analytics_events FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add A/B group column to banners
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS ab_group text NULL;
ALTER TABLE public.banners ADD CONSTRAINT banners_ab_group_check
  CHECK (ab_group IS NULL OR ab_group IN ('A', 'B'));
CREATE INDEX IF NOT EXISTS idx_banners_position_active_ab ON public.banners (position, is_active, ab_group);