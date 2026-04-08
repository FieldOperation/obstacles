-- ============================================
-- ADD CASE NUMBER: Case_000001, Case_000002, etc.
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Create sequence for auto-incrementing case numbers
CREATE SEQUENCE IF NOT EXISTS cases_case_number_seq START 1;

-- 2. Add case_number column (nullable for backfill)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_number INTEGER;

-- 3. Backfill existing cases: assign numbers by created_at order (oldest = 1)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM cases
  WHERE case_number IS NULL
)
UPDATE cases c
SET case_number = n.rn
FROM numbered n
WHERE c.id = n.id;

-- 4. Set sequence so next insert gets MAX + 1
SELECT setval('cases_case_number_seq', COALESCE((SELECT MAX(case_number) FROM cases), 0) + 1);

-- 5. Set default for new inserts
ALTER TABLE cases ALTER COLUMN case_number SET DEFAULT nextval('cases_case_number_seq');

-- 6. Add unique constraint (prevents duplicates)
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_case_number_key;
ALTER TABLE cases ADD CONSTRAINT cases_case_number_key UNIQUE (case_number);

-- 7. Make NOT NULL (all rows now have values)
ALTER TABLE cases ALTER COLUMN case_number SET NOT NULL;

-- 8. Create index for lookups
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
