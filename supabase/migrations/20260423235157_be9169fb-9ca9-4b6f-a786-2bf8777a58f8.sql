DROP POLICY IF EXISTS "Newsletter: public insert" ON public.newsletter_subscribers;

CREATE POLICY "Newsletter: public insert valid"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 5 AND 255
    AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    AND (source IS NULL OR length(source) <= 50)
    AND is_active = true
  );