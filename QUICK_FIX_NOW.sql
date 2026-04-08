-- ============================================
-- QUICK FIX - Run this NOW
-- ============================================
-- Your user ID: a8470db4-b46f-4be0-baf3-2f8c5745a92a
-- ============================================

-- Step 1: Create your user record
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
  updated_at = NOW();

-- Step 2: Verify it worked
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  '✅ User record exists!' as status
FROM users u
WHERE u.id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- If you see your user above, refresh your browser and login again!
