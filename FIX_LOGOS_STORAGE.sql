-- ============================================
-- STORAGE RLS: Allow logo images to be read
-- ============================================
-- Run in Supabase Dashboard → SQL Editor
-- Logos are stored in the 'logos' bucket for system_settings
-- Required for: web Settings page, mobile app headers
-- ============================================

DROP POLICY IF EXISTS "Public can read logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read logos" ON storage.objects;

-- Public bucket: anyone can read via getPublicUrl
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Private bucket: signed URLs need authenticated read (mobile app)
CREATE POLICY "Authenticated can read logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logos');
