-- ============================================
-- DIAGNOSE WHY QUERY IS TIMING OUT
-- ============================================

-- Step 1: Check if your user exists
SELECT 
  id,
  email,
  name,
  role,
  'User exists' as status
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- Step 2: Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Step 3: List ALL policies on users table
SELECT 
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'users';

-- Step 4: Test if query works WITHOUT RLS (temporarily)
-- WARNING: Only for testing!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT id, email, name, role FROM users WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- If this works, RLS is the problem
-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create the SIMPLEST possible policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON users;

-- This is the simplest policy - no recursion possible
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 6: Verify policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'SELECT';

-- Step 7: Test again (this should work now)
SELECT id, email, name, role 
FROM users 
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';
