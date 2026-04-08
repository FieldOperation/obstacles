-- ============================================
-- CONSOLIDATED RLS FIX: Fix Recursion and Visibility
-- ============================================
-- This script fixes the infinite recursion in the users table
-- and ensures that other data tables (zones, roads, etc.) are visible.
-- ============================================

-- 1. Create a ROBUST is_admin() function that bypasses RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
STABLE -- Performance optimization
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- We query the users table directly. Since this is SECURITY DEFINER,
  -- it will NOT trigger the policies on the users table recursively.
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role = 'ADMIN', false);
END;
$$;

-- 2. Fix USERS table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;

-- Anyone can read their OWN profile (simple check, no recursion)
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can read ALL profiles (uses the SECURITY DEFINER function)
CREATE POLICY "Admins can read all users"
ON users FOR SELECT
TO authenticated
USING (is_admin());

-- Users can update their OWN profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can update ALL users
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Allow anyone to insert (triggers and basic creation)
CREATE POLICY "Allow insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Fix DATA tables (Zones, Roads, Developers, Cases)
-- Ensure they are at least readable by authenticated users

-- ZONES
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage zones" ON zones;
DROP POLICY IF EXISTS "All authenticated users can read zones" ON zones;
CREATE POLICY "All authenticated users can read zones" ON zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage zones" ON zones FOR ALL TO authenticated USING (is_admin());

-- ROADS
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage roads" ON roads;
DROP POLICY IF EXISTS "All authenticated users can read roads" ON roads;
CREATE POLICY "All authenticated users can read roads" ON roads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roads" ON roads FOR ALL TO authenticated USING (is_admin());

-- DEVELOPERS
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage developers" ON developers;
DROP POLICY IF EXISTS "All authenticated users can read developers" ON developers;
CREATE POLICY "All authenticated users can read developers" ON developers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage developers" ON developers FOR ALL TO authenticated USING (is_admin());

-- CASES
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All authenticated users can view cases" ON cases;
DROP POLICY IF EXISTS "Admins can manage cases" ON cases;
DROP POLICY IF EXISTS "Admins can view all cases" ON cases;
CREATE POLICY "All authenticated users can view cases" ON cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage cases" ON cases FOR ALL TO authenticated USING (is_admin());

-- 4. Verify user exists and is ADMIN
-- Replace with the ID from the logs if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'omar_oudat@hotmail.com') THEN
    UPDATE users 
    SET role = 'ADMIN' 
    WHERE email = 'omar_oudat@hotmail.com';
    RAISE NOTICE '✅ User omar_oudat@hotmail.com set to ADMIN';
  END IF;
END $$;

-- 5. Verification Query
SELECT 'users' as table, count(*) FROM users
UNION ALL
SELECT 'zones', count(*) FROM zones
UNION ALL
SELECT 'roads', count(*) FROM roads
UNION ALL
SELECT 'cases', count(*) FROM cases;
