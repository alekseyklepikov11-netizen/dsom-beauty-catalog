-- 1. Stock alerts table
CREATE TABLE public.stock_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id, email)
);

ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can subscribe with valid email
CREATE POLICY "Stock alerts: public insert valid"
ON public.stock_alerts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND is_notified = false
);

-- Only editors/admins can read
CREATE POLICY "Stock alerts: editors read"
ON public.stock_alerts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Only editors/admins can update (mark as notified)
CREATE POLICY "Stock alerts: editors update"
ON public.stock_alerts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Only editors/admins can delete
CREATE POLICY "Stock alerts: editors delete"
ON public.stock_alerts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE INDEX idx_stock_alerts_product_id ON public.stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_pending ON public.stock_alerts(product_id) WHERE is_notified = false;

-- 2. Add skin_types array to products
ALTER TABLE public.products
ADD COLUMN skin_types TEXT[] DEFAULT '{}'::TEXT[];

CREATE INDEX idx_products_skin_types ON public.products USING GIN(skin_types);

COMMENT ON COLUMN public.products.skin_types IS 'Array of skin types: dry, oily, combination, normal, sensitive';