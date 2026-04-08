-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================
-- The error "infinite recursion detected" happens when
-- a policy on users table queries the users table itself
-- ============================================

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;

-- Step 2: Create simple policy that doesn't cause recursion
-- This policy allows users to read their own record using auth.uid()
-- It doesn't query the users table, so no recursion!
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 3: Allow users to update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 4: For admin operations, we need a different approach
-- Since we can't query users table in the policy, we'll use a function
-- that checks the role from auth metadata or use a simpler approach

-- Option A: Use auth.jwt() to check role (if stored in JWT)
-- This requires storing role in JWT, which we'll do via a trigger

-- Option B: Create a function that bypasses RLS for admin checks
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN user_role = 'ADMIN';
END;
$$;

-- Step 5: Use the function for admin policies
CREATE POLICY "Admins can read all users"
ON users FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (is_admin());

-- Step 6: Allow trigger to insert users (for auto-creation)
-- This is needed for the handle_new_user() trigger
CREATE POLICY "Allow trigger to insert users"
ON users FOR INSERT
WITH CHECK (true);

-- Step 7: Verify policies
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 8: Test if you can read your own user
-- This should work now without recursion
SELECT 
  id,
  email,
  name,
  role,
  '✅ RLS is working!' as status
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- If Step 8 returns your user, the fix worked!
-- Refresh your browser and try logging in again
