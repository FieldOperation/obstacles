-- ============================================
-- DIAGNOSE: Why photos don't appear in cases
-- Run in Supabase SQL Editor (as postgres/admin)
-- ============================================

-- 1. Check if photos exist in the database
SELECT id, case_id, closure_case_id, filename, created_at 
FROM photos 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Check storage objects (files in 'cases' bucket)
SELECT name, bucket_id, created_at 
FROM storage.objects 
WHERE bucket_id = 'cases' 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Storage policies on 'cases' bucket
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 4. Photos table RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'photos';

-- 5. Make 'cases' bucket PUBLIC (if not already)
-- In Supabase Dashboard: Storage → Buckets → cases → Toggle "Public bucket" ON
-- This allows getPublicUrl to work without signed URLs.
