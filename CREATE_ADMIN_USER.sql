-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- 
-- IMPORTANT: You must FIRST create the auth user in Supabase Dashboard:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Email: admin@example.com
-- 4. Password: (choose a strong password)
-- 5. Auto Confirm User: ✅ Yes
-- 6. Click "Create User"
-- 7. Copy the User ID (UUID) shown
--
-- THEN run this SQL query, replacing:
-- - 'USER_ID_FROM_AUTH' with the UUID you copied
-- - 'admin@example.com' with the email you used
-- - 'Your Admin Password' with a note (password is in auth, not here)
-- ============================================

-- Option 1: If you know the auth user ID
INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
VALUES (
  'USER_ID_FROM_AUTH',  -- ⚠️ REPLACE THIS with the UUID from auth.users
  'admin@example.com',  -- ⚠️ REPLACE with your admin email
  'System Administrator',
  'ADMIN',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = 'ADMIN',
  updated_at = NOW();

-- ============================================
-- Option 2: Auto-create from existing auth user
-- (Use this if you already created the auth user)
-- ============================================

-- This will create a user record for the first auth user that doesn't have a record
DO $$
DECLARE
  auth_user_id UUID;
  auth_user_email TEXT;
BEGIN
  -- Find the first auth user that doesn't have a users table record
  SELECT au.id, au.email INTO auth_user_id, auth_user_email
  FROM auth.users au
  LEFT JOIN users u ON u.id = au.id
  WHERE u.id IS NULL
  ORDER BY au.created_at
  LIMIT 1;

  -- If found, create the user record
  IF auth_user_id IS NOT NULL THEN
    INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
    VALUES (
      auth_user_id,
      auth_user_email,
      COALESCE(auth_user_email::text, 'Admin User'),
      'ADMIN',
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created admin user: % (%)', auth_user_email, auth_user_id;
  ELSE
    RAISE NOTICE 'No auth users found without user records';
  END IF;
END $$;

-- ============================================
-- Option 3: Create admin for specific email
-- ============================================

-- Replace 'admin@example.com' with your actual admin email
DO $$
DECLARE
  auth_user_id UUID;
  auth_user_email TEXT;
BEGIN
  SELECT id, email INTO auth_user_id, auth_user_email
  FROM auth.users
  WHERE email = 'admin@example.com'  -- ⚠️ REPLACE with your admin email
  LIMIT 1;

  IF auth_user_id IS NOT NULL THEN
    INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
    VALUES (
      auth_user_id,
      auth_user_email,
      'System Administrator',
      'ADMIN',
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'ADMIN',
      updated_at = NOW();
    
    RAISE NOTICE 'Admin user created/updated: % (%)', auth_user_email, auth_user_id;
  ELSE
    RAISE NOTICE 'No auth user found with email: admin@example.com';
    RAISE NOTICE 'Please create the auth user first in Supabase Dashboard';
  END IF;
END $$;

-- ============================================
-- Verify the admin user was created
-- ============================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.zone_id,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE u.role = 'ADMIN'
ORDER BY u.created_at DESC;
