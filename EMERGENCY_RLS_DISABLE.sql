-- ============================================
-- EMERGENCY FIX: STOP THE HANGING
-- ============================================
-- This script:
-- 1. Drops the problematic sync trigger
-- 2. Disables RLS on the users table temporarily (to restore service)
-- 3. Sets your role to ADMIN
-- ============================================

-- STEP 1: DROP THE TRIGGER
DROP TRIGGER IF EXISTS tr_sync_user_role ON public.users;
DROP FUNCTION IF EXISTS public.sync_user_role();

-- STEP 2: DISABLE RLS TEMPORARILY
-- This will prove if the hanging is caused by RLS or not.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- STEP 3: ENSURE DATA VISIBILITY
-- For other tables, we use the simplest possible "allow all" for now
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE roads DISABLE ROW LEVEL SECURITY;
ALTER TABLE developers DISABLE ROW LEVEL SECURITY;
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;

-- STEP 4: FORCE YOUR ROLE TO ADMIN
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'omar_oudat@hotmail.com' 
   OR id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';

-- STEP 5: VERIFY IF IT WORKS
-- If the system is still hanging AFTER running this, 
-- then the problem is in the frontend code or backend server, not the database.
SELECT 'SUCCESS: RLS Disabled and Trigger Dropped' as status;
