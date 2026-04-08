-- ============================================
-- MOBILE: Fix Case ID + Logos
-- Run in Supabase Dashboard → SQL Editor
-- ============================================
-- 1. Enables Case_000001, Case_000002 display
-- 2. Enables logo reads from storage
-- ============================================

-- PART 1: Case numbers (Case_000001, Case_000002, ...)
CREATE SEQUENCE IF NOT EXISTS cases_case_number_seq START 1;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_number INTEGER;
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM cases
  WHERE case_number IS NULL
)
UPDATE cases c SET case_number = n.rn
FROM numbered n WHERE c.id = n.id;
SELECT setval('cases_case_number_seq', COALESCE((SELECT MAX(case_number) FROM cases), 0) + 1);
ALTER TABLE cases ALTER COLUMN case_number SET DEFAULT nextval('cases_case_number_seq');
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_case_number_key;
ALTER TABLE cases ADD CONSTRAINT cases_case_number_key UNIQUE (case_number);
ALTER TABLE cases ALTER COLUMN case_number SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);

-- PART 2: Storage RLS for logos bucket
DROP POLICY IF EXISTS "Public can read logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read logos" ON storage.objects;
CREATE POLICY "Public can read logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'logos');
CREATE POLICY "Authenticated can read logos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'logos');

-- ============================================
-- MANUAL STEP: Create logos bucket if missing
-- ============================================
-- In Supabase Dashboard → Storage → New bucket:
-- 1. Name: logos
-- 2. Turn ON "Public bucket" (required for getPublicUrl to work)
-- 3. Save
--
-- Then upload logos via web app Settings page (Admin)
