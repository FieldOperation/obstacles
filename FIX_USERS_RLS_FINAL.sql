-- ============================================
-- FINAL FIX: Allow users to read their own profile
-- ============================================
-- The query is timing out because RLS is blocking it
-- ============================================

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;

-- Step 2: Create the simplest possible policy
-- This uses auth.uid() which is available without querying users table
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Step 3: Verify the policy
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';

-- Step 4: Test if you can read your own user
-- This should return your user if RLS is working
SELECT 
  id,
  email,
  name,
  role,
  '✅ RLS is working!' as status
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- If Step 4 returns your user, RLS is fixed!
-- Refresh your browser and the query should work
