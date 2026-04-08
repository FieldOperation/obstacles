-- ============================================
-- FIX: Case photos not loading when opening public URL in new tab
-- ============================================
-- Run in Supabase Dashboard → SQL Editor
-- ============================================
-- When the bucket is "Public", opening a URL like:
--   https://xxx.supabase.co/storage/v1/object/public/cases/1771788760980-pj15ns.jpg
-- must be allowed for unauthenticated (anon) requests. This adds the right policy.
-- ============================================

-- Remove old policy if it exists (we'll replace with one that includes anon)
DROP POLICY IF EXISTS "Public can read cases" ON storage.objects;

-- Allow both anon (unauthenticated) and authenticated to read from cases bucket.
-- anon = when user opens the image URL in a new tab or shares the link.
CREATE POLICY "Public can read cases"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'cases');

-- Verify: In Storage → cases bucket, ensure "Public bucket" is ON.
-- (Dashboard: Storage → Buckets → cases → toggle "Public bucket")
