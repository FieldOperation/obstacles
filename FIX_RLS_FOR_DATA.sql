-- ============================================
-- FIX RLS POLICIES FOR CASES, ZONES, ROADS
-- ============================================
-- These policies query users table, causing infinite recursion
-- We'll use the is_admin() function we created earlier
-- ============================================

-- Step 1: Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view cases based on role" ON cases;
DROP POLICY IF EXISTS "Users can modify cases based on role" ON cases;
DROP POLICY IF EXISTS "Admins can delete cases" ON cases;
DROP POLICY IF EXISTS "Users can view photos of accessible cases" ON photos;
DROP POLICY IF EXISTS "Workers and admins can insert photos" ON photos;

-- Step 2: Create simple policies using is_admin() function
-- This function bypasses RLS, so no recursion!

-- Cases: Admins see all, others see all (read-only)
CREATE POLICY "Admins can view all cases"
ON cases FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "All authenticated users can view cases"
ON cases FOR SELECT
TO authenticated
USING (true);

-- Cases: Only admins and workers can create
CREATE POLICY "Admins and workers can create cases"
ON cases FOR INSERT
TO authenticated
WITH CHECK (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'WORKER'
  )
);

-- Cases: Only admins can update/delete
CREATE POLICY "Admins can update cases"
ON cases FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete cases"
ON cases FOR DELETE
TO authenticated
USING (is_admin());

-- Photos: Anyone can view photos of cases they can see
CREATE POLICY "Users can view photos"
ON photos FOR SELECT
TO authenticated
USING (true);

-- Photos: Admins and workers can insert
CREATE POLICY "Admins and workers can insert photos"
ON photos FOR INSERT
TO authenticated
WITH CHECK (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'WORKER'
  )
);

-- Zones: Admins can manage, all can read
DROP POLICY IF EXISTS "Admins can manage zones" ON zones;
DROP POLICY IF EXISTS "All authenticated users can read zones" ON zones;

CREATE POLICY "Admins can manage zones"
ON zones FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "All authenticated users can read zones"
ON zones FOR SELECT
TO authenticated
USING (true);

-- Roads: Admins can manage, all can read
DROP POLICY IF EXISTS "Admins can manage roads" ON roads;
DROP POLICY IF EXISTS "All authenticated users can read roads" ON roads;

CREATE POLICY "Admins can manage roads"
ON roads FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "All authenticated users can read roads"
ON roads FOR SELECT
TO authenticated
USING (true);

-- Developers: Admins can manage, all can read
DROP POLICY IF EXISTS "Admins can manage developers" ON developers;
DROP POLICY IF EXISTS "All authenticated users can read developers" ON developers;

CREATE POLICY "Admins can manage developers"
ON developers FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "All authenticated users can read developers"
ON developers FOR SELECT
TO authenticated
USING (true);

-- Step 3: Verify policies
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename IN ('cases', 'zones', 'roads', 'developers', 'photos')
ORDER BY tablename, policyname;

-- Step 4: Test if you can read cases
SELECT COUNT(*) as case_count FROM cases;
SELECT COUNT(*) as zone_count FROM zones;
SELECT COUNT(*) as road_count FROM roads;

-- If these return counts > 0, RLS is working!
