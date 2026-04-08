-- ============================================
-- SIMPLE RLS TEST
-- ============================================
-- Run this to test if RLS is blocking queries
-- ============================================

-- Step 1: Check if you can read cases (as authenticated user)
-- This should return data if RLS is working
SELECT COUNT(*) as total_cases FROM cases;

-- Step 2: If Step 1 returns 0 but you know cases exist, RLS is blocking!
-- Fix it with this:

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view cases based on role" ON cases;
DROP POLICY IF EXISTS "Admins can view all cases" ON cases;
DROP POLICY IF EXISTS "All authenticated users can view cases" ON cases;

-- Create simple policy: ALL authenticated users can view ALL cases
CREATE POLICY "All authenticated users can view cases"
ON cases FOR SELECT
TO authenticated
USING (true);

-- Step 3: Test again
SELECT COUNT(*) as total_cases FROM cases;
SELECT * FROM cases LIMIT 5;

-- Step 4: Fix zones
DROP POLICY IF EXISTS "Admins can manage zones" ON zones;
DROP POLICY IF EXISTS "All authenticated users can read zones" ON zones;

CREATE POLICY "All authenticated users can read zones"
ON zones FOR SELECT
TO authenticated
USING (true);

-- Step 5: Fix roads
DROP POLICY IF EXISTS "Admins can manage roads" ON roads;
DROP POLICY IF EXISTS "All authenticated users can read roads" ON roads;

CREATE POLICY "All authenticated users can read roads"
ON roads FOR SELECT
TO authenticated
USING (true);

-- Step 6: Test all
SELECT 
  (SELECT COUNT(*) FROM cases) as cases_count,
  (SELECT COUNT(*) FROM zones) as zones_count,
  (SELECT COUNT(*) FROM roads) as roads_count;

-- If all counts > 0, RLS is fixed!
