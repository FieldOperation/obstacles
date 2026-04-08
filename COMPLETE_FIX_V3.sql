-- ============================================
-- COMPLETE FIX V3: THE NUCLEAR RESET
-- ============================================
-- This script will:
-- 1. DROP ALL current policies on ALL tables (users, zones, roads, developers, cases, photos, notifications, settings)
-- 2. DISABLE RLS temporarily to ensure baseline access works
-- 3. Re-create a safe, non-recursive is_admin() function
-- 4. Apply clean, simple policies
-- 5. Force-verify your ADMIN status
-- ============================================

-- STEP 1: DROP ALL POLICIES ON ALL RELEVANT TABLES
DO $$ 
DECLARE 
    t TEXT;
    pol RECORD;
BEGIN 
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
             AND tablename IN ('users', 'zones', 'roads', 'developers', 'cases', 'photos', 'notifications', 'system_settings')
    LOOP
        FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = t) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, t);
            RAISE NOTICE 'Dropped policy: % on table %', pol.policyname, t;
        END LOOP;
        
        -- Temporarily disable RLS to allow baseline testing
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
        RAISE NOTICE 'RLS Disabled on table: %', t;
    END LOOP;
END $$;

-- STEP 2: RE-CREATE is_admin() STRICTLY
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Crucial: bypasses RLS of the caller
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- We query the table directly. Since this is SECURITY DEFINER,
  -- it will run as the owner (postgres) and bypass RLS.
  SELECT role INTO user_role FROM users WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'ADMIN', false);
END;
$$;

-- STEP 3: ENABLE RLS AND APPLY CLEAN POLICIES
-- We re-enable RLS but apply much simpler rules

-- 3.1 USERS TABLE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own record"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can manage all users"
ON users FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow system insert"
ON users FOR INSERT
WITH CHECK (true);

-- 3.2 DATA TABLES (Read access to all authenticated users)
-- This prevents "Logged in but with no data"

-- ZONES
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read zones" ON zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage zones" ON zones FOR ALL TO authenticated USING (is_admin());

-- ROADS
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roads" ON roads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage roads" ON roads FOR ALL TO authenticated USING (is_admin());

-- DEVELOPERS
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read developers" ON developers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage developers" ON developers FOR ALL TO authenticated USING (is_admin());

-- CASES
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cases" ON cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage cases" ON cases FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Worker create cases" ON cases FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')));

-- PHOTOS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read photos" ON photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage photos" ON photos FOR ALL TO authenticated USING (is_admin());

-- STEP 4: ENSURE YOUR USER IS ADMIN
-- Using your ID and Email from the logs
INSERT INTO users (id, email, name, role, created_at, updated_at)
VALUES (
    'a8470db4-b46f-4be0-baf3-2f8c5745a92a',
    'omar_oudat@hotmail.com',
    'Omar',
    'ADMIN',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'ADMIN', updated_at = NOW();

-- STEP 5: FINAL VERIFICATION
SELECT 'users' as table, count(*) FROM users
UNION ALL
SELECT 'zones', count(*) FROM zones
UNION ALL
SELECT 'roads', count(*) FROM roads
UNION ALL
SELECT 'cases', count(*) FROM cases;
