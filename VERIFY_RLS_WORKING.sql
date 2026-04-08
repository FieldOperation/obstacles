-- ============================================
-- VERIFY RLS IS WORKING
-- ============================================
-- Run this to check if RLS policy is correct
-- ============================================

-- Step 1: Check current policies
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 2: Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Step 3: Test the query directly (this simulates what the frontend does)
-- This should return your user if RLS is working
SELECT 
  id,
  email,
  name,
  role,
  zone_id
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- Step 4: If Step 3 returns nothing, try this fix:
-- Temporarily disable RLS to test
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test again
SELECT 
  id,
  email,
  name,
  role
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- If this works, RLS was the problem
-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create the correct policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;

CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 5: Verify it works now
SELECT 
  id,
  email,
  name,
  role,
  '✅ Should work now!' as status
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';
