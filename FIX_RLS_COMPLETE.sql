-- ============================================
-- COMPLETE RLS FIX FOR USERS TABLE
-- ============================================
-- Run this entire script in Supabase Dashboard → SQL Editor
-- ============================================

-- Step 1: Disable RLS temporarily to test
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify your user exists
SELECT 
  id,
  email,
  name,
  role,
  'User exists' as status
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;

-- Step 5: Create the simplest possible SELECT policy (no recursion)
-- This allows users to read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 6: Verify the policy was created
SELECT 
  policyname,
  cmd as command,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';

-- Step 7: Test the query (should work now)
-- This simulates what the frontend does
SELECT 
  id,
  email,
  name,
  role,
  zone_id,
  '✅ Query works!' as status
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- ============================================
-- AFTER RUNNING THIS:
-- 1. Refresh your browser (Ctrl+Shift+R)
-- 2. Check console - should see "✅ Query completed" instead of timeout
-- 3. Your actual role should load from database
-- ============================================
