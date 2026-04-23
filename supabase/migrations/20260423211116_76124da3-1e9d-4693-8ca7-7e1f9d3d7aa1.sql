
-- Fix mutable search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Replace broad public-read policies on storage.objects with folder-scoped reads
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read brand-logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
DROP POLICY IF EXISTS "Public read media" ON storage.objects;

CREATE POLICY "Public read product-images files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'public');

CREATE POLICY "Public read brand-logos files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = 'public');

CREATE POLICY "Public read banners files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = 'public');

CREATE POLICY "Public read media files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'public');
