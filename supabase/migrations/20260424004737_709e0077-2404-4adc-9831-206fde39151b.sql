-- Create has_role function if not exists
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create reviews table with moderation support
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_name TEXT,
    guest_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews"
    ON public.reviews
    FOR SELECT
    USING (status = 'approved');

-- Policy: Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all reviews"
    ON public.reviews
    FOR ALL
    TO authenticated
    USING (public.has_role('admin', auth.uid()))
    WITH CHECK (public.has_role('admin', auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Trigger to auto-approve reviews from authenticated users
CREATE OR REPLACE FUNCTION auto_approve_user_reviews()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        NEW.status := 'approved';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS auto_approve_user_reviews_trigger ON public.reviews;
CREATE TRIGGER auto_approve_user_reviews_trigger
    BEFORE INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_user_reviews();