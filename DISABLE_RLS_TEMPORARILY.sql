-- ============================================
-- TEMPORARILY DISABLE RLS TO TEST
-- ============================================
-- This will help us determine if RLS is the problem
-- ============================================

-- Step 1: Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Test if query works now
-- Go back to your browser and refresh
-- The query should work immediately

-- Step 3: If it works, re-enable RLS with correct policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON users;

CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 4: Verify policy
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';

-- Step 5: Test query again (should work now)
SELECT id, email, name, role 
FROM users 
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';
