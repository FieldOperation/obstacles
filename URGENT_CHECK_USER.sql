-- ============================================
-- URGENT: Check if your user exists
-- ============================================
-- Your user ID: a8470db4-b46f-4be0-baf3-2f8c5745a92a
-- ============================================

-- Step 1: Check if user exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  '✅ Exists in auth.users' as status
FROM auth.users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- Step 2: Check if user exists in users table
SELECT 
  id,
  email,
  name,
  role,
  zone_id,
  created_at,
  '✅ Exists in users table' as status
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- Step 3: If user doesn't exist in users table, CREATE IT NOW
INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(SPLIT_PART(au.email, '@', 1), 'User') as name,
  'ADMIN' as role,
  NULL as zone_id,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a'
AND NOT EXISTS (
  SELECT 1 FROM users WHERE id = au.id
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'ADMIN',
  updated_at = NOW()
RETURNING *;

-- Step 4: Verify RLS policies allow reading
-- Check if you can read your own user record
SELECT 
  'RLS Test' as test,
  id,
  email,
  role
FROM users
WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- If Step 4 returns your user, RLS is working!
-- If Step 4 returns nothing, RLS is blocking - run FIX_RLS_POLICIES.sql
