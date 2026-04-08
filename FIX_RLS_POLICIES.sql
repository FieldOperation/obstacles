-- ============================================
-- FIX RLS POLICIES FOR USERS TABLE
-- ============================================
-- This ensures users can read their own profile
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Policy 2: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND (
    -- Users can't change their own role
    role = (SELECT role FROM users WHERE id = auth.uid())
    OR
    -- Admins can change role
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
);

-- Policy 3: Admins can read all users
CREATE POLICY "Admins can read all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Policy 4: Admins can insert users (for user creation)
CREATE POLICY "Admins can insert users"
ON users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Policy 5: Admins can update all users
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Policy 6: Admins can delete users
CREATE POLICY "Admins can delete users"
ON users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Policy 7: Allow trigger to insert users (for auto-creation)
-- This is needed for the handle_new_user() trigger
CREATE POLICY "Allow trigger to insert users"
ON users FOR INSERT
WITH CHECK (true);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
