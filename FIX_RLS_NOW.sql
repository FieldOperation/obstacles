-- ============================================
-- FIX RLS POLICIES - Run this NOW
-- ============================================
-- Your user exists but RLS is blocking the query
-- ============================================

-- Step 1: Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;

-- Step 2: Create a simple policy that allows users to read their own record
-- This uses auth.uid() which is available even if the user record doesn't exist yet
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Step 3: Allow admins to read all users (for admin panel)
CREATE POLICY "Admins can read all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Step 4: Test if you can read your own user record
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
-- Refresh your browser and try logging in again
