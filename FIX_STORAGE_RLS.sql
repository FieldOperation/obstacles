-- ============================================
-- STORAGE RLS: Allow case photo uploads
-- ============================================
-- Run in Supabase Dashboard → SQL Editor
-- Fixes: "new row violates row-level security policy" when creating a case with photos
-- ============================================

-- Drop existing policies if they exist (avoid duplicates)
DROP POLICY IF EXISTS "Authenticated users can upload to cases" ON storage.objects;
DROP POLICY IF EXISTS "Public can read cases" ON storage.objects;

-- Allow authenticated users to upload files to the cases bucket
CREATE POLICY "Authenticated users can upload to cases"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cases');

-- Allow anyone to read (public URLs for case photos)
CREATE POLICY "Public can read cases"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cases');

-- Optional: Allow authenticated users to delete their uploads (e.g. when closing a case)
-- Uncomment if you need delete/update on storage:
-- CREATE POLICY "Authenticated can update cases bucket"
-- ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cases');
-- CREATE POLICY "Authenticated can delete from cases bucket"
-- ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cases');
