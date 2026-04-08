-- ============================================
-- VERIFY: Why public image link opens blank
-- Run in Supabase Dashboard → SQL Editor
-- ============================================
-- If the public URL opens but shows a blank page, the file may be missing
-- or the path may not match. Run these and compare.
-- ============================================

-- 1. Recent photos in DB (filename we use in the app)
SELECT id, case_id, filename, created_at
FROM photos
WHERE closure_case_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. Actual files in the 'cases' storage bucket (name = path in bucket)
SELECT name, bucket_id, created_at
FROM storage.objects
WHERE bucket_id = 'cases'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check: do every photo.filename exist in storage.objects?
-- (If this returns rows, those photos have NO matching file in storage = blank when opened)
SELECT p.id, p.case_id, p.filename
FROM photos p
WHERE p.closure_case_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = 'cases' AND o.name = p.filename
  )
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Storage policies (should allow anon SELECT for bucket 'cases')
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
