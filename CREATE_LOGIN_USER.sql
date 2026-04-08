-- ============================================
-- CREATE A USER THAT CAN LOG IN (username + password)
-- ============================================
-- Your app uses username-only login: users log in with "username" and password.
-- Internally we use email = username@obstacles.local
--
-- STEP 1: Create the auth user in Supabase Dashboard
-- -----------------------------------------
-- 1. Go to: Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email:  admin@obstacles.local   (this is the "username" - use any name before @)
-- 4. Password: (choose a password, min 6 characters)
-- 5. Auto Confirm User: ✅ Yes  (you disabled email confirmation, so this just marks them ready)
-- 6. Click "Create user"
-- 7. Leave the Dashboard open; you'll run the query below next.
--
-- STEP 2: Run ONE of the options below in SQL Editor
-- -----------------------------------------
-- Use Option A if you want to type the email once.
-- Use Option B to sync ALL auth users that don't have a row in users yet.
-- ============================================

-- ---------- Option A: Create/sync user for a specific login (email = username@obstacles.local) ----------
-- Change 'admin@obstacles.local' if you used a different email in Step 1 (e.g. manager@obstacles.local)
DO $$
DECLARE
  auth_user_id UUID;
  auth_user_email TEXT;
BEGIN
  SELECT id, email INTO auth_user_id, auth_user_email
  FROM auth.users
  WHERE email = 'admin@obstacles.local'   -- ⬅️ Change to match the email you used in Dashboard
  LIMIT 1;

  IF auth_user_id IS NOT NULL THEN
    INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
    VALUES (
      auth_user_id,
      auth_user_email,
      'Admin',                           -- Display name (you can change)
      'ADMIN',                           -- Role: ADMIN, WORKER, or OTHERS
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role, updated_at = NOW();
    RAISE NOTICE 'User created/updated. Login with username: admin and your password.';
  ELSE
    RAISE NOTICE 'No auth user with email admin@obstacles.local. Create them in Dashboard first (Step 1).';
  END IF;
END $$;


-- ---------- Option B: Sync ALL auth users that don't have a users row yet ----------
-- Run this if you created one or more users in Dashboard and want them all in public.users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN users u ON u.id = au.id
    WHERE u.id IS NULL
  LOOP
    INSERT INTO users (id, email, name, role, zone_id, created_at, updated_at)
    VALUES (
      r.id,
      r.email,
      COALESCE(split_part(r.email, '@', 1), 'User'),
      'ADMIN',
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Created user: % (login username: %)', r.email, split_part(r.email, '@', 1);
  END LOOP;
END $$;


-- ---------- Verify ----------
SELECT id, email, name, role, zone_id
FROM users
ORDER BY created_at DESC;
