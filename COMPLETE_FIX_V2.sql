-- ============================================
-- COMPLETE FIX V2: The FOOLPROOF Way
-- ============================================
-- This script will:
-- 1. Drop EVERY SINGLE policy on the users table (clean slate)
-- 2. Create a safe is_admin() function
-- 3. Create non-recursive policies
-- 4. Ensure your specific user is an ADMIN
-- ============================================

-- STEP 1: DROP ALL POLICIES ON USERS (The Clean Slate)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- STEP 2: RE-CREATE is_admin() correctly
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'ADMIN', false);
END;
$$;

-- STEP 3: CREATE ONLY NON-RECURSIVE POLICIES

-- Safe Select: Most important fix
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can read all users"
ON users FOR SELECT
TO authenticated
USING (is_admin());

-- Safe Updates
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Safe Inserts (for triggers)
CREATE POLICY "Allow trigger to insert users"
ON users FOR INSERT
WITH CHECK (true);

-- STEP 4: ENSURE YOUR USER IS ADMIN
-- The ID from your logs is: a8470db4-b46f-4be0-baf3-2f8c5745a92a
-- The email is: omar_oudat@hotmail.com

INSERT INTO users (id, email, name, role, created_at, updated_at)
VALUES (
    'a8470db4-b46f-4be0-baf3-2f8c5745a92a',
    'omar_oudat@hotmail.com',
    'Omar',
    'ADMIN',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'ADMIN', updated_at = NOW();

-- STEP 5: TEST QUERY (Should run instantly)
SELECT id, email, name, role 
FROM users 
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- STEP 6: FIX OTHER TABLES Visibility
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All can read zones" ON zones;
CREATE POLICY "All can read zones" ON zones FOR SELECT TO authenticated USING (true);

ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All can read roads" ON roads;
CREATE POLICY "All can read roads" ON roads FOR SELECT TO authenticated USING (true);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All can read cases" ON cases;
CREATE POLICY "All can read cases" ON cases FOR SELECT TO authenticated USING (true);
