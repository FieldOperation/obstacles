-- ============================================
-- URGENT FIX: Allow users to read their own profile
-- ============================================
-- This fixes the infinite loading issue
-- ============================================

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Step 2: Create a better policy that works even if user doesn't exist yet
-- This allows users to read their own record by matching auth.uid()
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Step 3: Make sure trigger can insert users
-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- Step 4: Create user record for your auth user if it doesn't exist
-- Replace 'a8470db4-b46f-4be0-baf3-2f8c5745a92a' with your actual user ID from console
DO $$
DECLARE
  user_id_to_check UUID := 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';  -- Your user ID
  user_email TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists in users table
  SELECT EXISTS(SELECT 1 FROM users WHERE id = user_id_to_check) INTO user_exists;
  
  IF NOT user_exists THEN
    -- Get email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id_to_check;
    
    IF user_email IS NOT NULL THEN
      -- Create user record
      INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
      VALUES (
        user_id_to_check,
        user_email,
        COALESCE(SPLIT_PART(user_email, '@', 1), 'User'),
        'ADMIN',  -- Set as ADMIN so you can manage the system
        NULL,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET role = 'ADMIN', updated_at = NOW();
      
      RAISE NOTICE '✅ Created user record for: % (%)', user_email, user_id_to_check;
    ELSE
      RAISE NOTICE '⚠️ Could not find auth user with ID: %', user_id_to_check;
    END IF;
  ELSE
    RAISE NOTICE '✅ User record already exists';
    
    -- Update role to ADMIN if not already
    UPDATE users
    SET role = 'ADMIN', updated_at = NOW()
    WHERE id = user_id_to_check AND role != 'ADMIN';
    
    RAISE NOTICE '✅ User role set to ADMIN';
  END IF;
END $$;

-- Step 5: Verify the fix
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  au.email_confirmed_at,
  '✅ Ready' as status
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE u.id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';  -- Your user ID

-- ============================================
-- If Step 5 shows your user, you're good!
-- Refresh your browser and try logging in again
-- ============================================
