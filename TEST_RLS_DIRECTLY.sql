-- ============================================
-- TEST RLS DIRECTLY
-- ============================================
-- Run this to see if RLS is blocking
-- ============================================

-- Step 1: Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- Step 2: List all policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'users';

-- Step 3: Test if you can read your user (as the authenticated user)
-- This simulates what the frontend is trying to do
-- Note: This will only work if you're authenticated
SELECT 
  id,
  email,
  name,
  role,
  '✅ Can read own profile' as status
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- Step 4: If Step 3 returns nothing, RLS is blocking
-- Fix it with this:
DROP POLICY IF EXISTS "Users can read own profile" ON users;

CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Step 5: Also make sure the policy allows reading when user is authenticated
-- Add this policy as well:
CREATE POLICY "Authenticated users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 6: Verify policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'SELECT';
