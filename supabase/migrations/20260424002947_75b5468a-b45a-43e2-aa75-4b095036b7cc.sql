-- Reviews table with moderation
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NULL,
  guest_name text NULL,
  guest_email text NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews; admins/editors see all
CREATE POLICY "Reviews public read approved"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- Authenticated users insert reviews tied to their own user_id (auto-approved later via trigger optional, but here pending by default)
CREATE POLICY "Reviews authenticated insert own"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND length(body) BETWEEN 3 AND 4000
    AND rating BETWEEN 1 AND 5
  );

-- Guests (anon) can submit reviews (always pending)
CREATE POLICY "Reviews anon insert guest"
  ON public.reviews FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND guest_name IS NOT NULL AND length(guest_name) BETWEEN 2 AND 100
    AND guest_email IS NOT NULL AND guest_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    AND length(body) BETWEEN 3 AND 4000
    AND rating BETWEEN 1 AND 5
    AND status = 'pending'
  );

-- Admins/editors manage all reviews (moderation)
CREATE POLICY "Reviews editors update"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Reviews admin delete"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Trigger: auto-approve reviews from authenticated users (registered = trusted)
CREATE OR REPLACE FUNCTION public.auto_approve_user_reviews()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_auto_approve
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_user_reviews();

CREATE TRIGGER trg_reviews_touch
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Add 'review_submit' and 'banner_view' to analytics enum if missing (banner_view already exists)
ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'review_submit';