-- ============================================
-- FIX INFINITE LOADING ISSUE
-- ============================================
-- This happens when user exists in auth.users but NOT in users table
-- ============================================

-- Step 1: Check if user exists in users table
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  u.id as user_table_id,
  u.role,
  CASE 
    WHEN u.id IS NULL THEN '❌ MISSING - User needs to be created'
    ELSE '✅ EXISTS'
  END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
ORDER BY au.created_at DESC;

-- ============================================
-- Step 2: Create missing user records
-- ============================================
-- This will create user records for all auth users that don't have one
-- ============================================

DO $$
DECLARE
  auth_user_record RECORD;
  created_count INTEGER := 0;
BEGIN
  -- Loop through all auth users without user records
  FOR auth_user_record IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN users u ON u.id = au.id
    WHERE u.id IS NULL
  LOOP
    -- Create user record
    INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
    VALUES (
      auth_user_record.id,
      auth_user_record.email,
      COALESCE(SPLIT_PART(auth_user_record.email, '@', 1), 'User'),
      'OTHERS',  -- Default role, admin can change later
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    created_count := created_count + 1;
    RAISE NOTICE 'Created user record for: % (%)', auth_user_record.email, auth_user_record.id;
  END LOOP;
  
  IF created_count > 0 THEN
    RAISE NOTICE '✅ Created % user record(s)', created_count;
  ELSE
    RAISE NOTICE '✅ All auth users have user records';
  END IF;
END $$;

-- ============================================
-- Step 3: Verify the fix
-- ============================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.zone_id,
  au.email_confirmed_at,
  '✅ Ready to login' as status
FROM users u
JOIN auth.users au ON au.id = u.id
ORDER BY u.created_at DESC;

-- ============================================
-- Step 4: If you want to set a specific user as ADMIN
-- ============================================
-- Replace 'your-email@example.com' with your actual email
-- ============================================

UPDATE users
SET role = 'ADMIN', updated_at = NOW()
WHERE email = 'your-email@example.com'  -- ⚠️ REPLACE with your email
AND id IN (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- Verify admin was set
SELECT email, role FROM users WHERE role = 'ADMIN';
