-- ============================================
-- PERMANENT RLS FIX: NO MORE TIMEOUTS
-- ============================================
-- This script solves the infinite recursion once and for all by:
-- 1. Breaking the dependency chain in the SELECT policy.
-- 2. Syncing user roles to Supabase Auth metadata (so we can check roles without querying the DB).
-- ============================================

-- STEP 1: DROP ALL POLICIES AND START CLEAN
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
        END LOOP;
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- STEP 2: CREATE SYNC TRIGGER (Role -> Auth Metadata)
-- This allows us to check role in RLS without ANY recursion!
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's role in Supabase Auth metadata
    UPDATE auth.users 
    SET raw_app_meta_data = 
        jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            '{role}',
            format('"%s"', NEW.role)::jsonb
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_user_role ON public.users;
CREATE TRIGGER tr_sync_user_role
AFTER INSERT OR UPDATE OF role ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

-- STEP 3: APPLY NON-RECURSIVE POLICIES FOR USERS TABLE

-- POLICY 1: Simple Select (NO is_admin call = NO recursion)
CREATE POLICY "Authenticated users can read all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- POLICY 2: Admin Manage (using metadata check - perfectly safe/fast)
-- Note: auth.jwt() -> 'app_metadata' -> 'role' is the standard way to do this
CREATE POLICY "Admins can manage all users"
ON users FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN' 
    OR 
    (id = auth.uid()) -- Allow users to update themselves
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
    OR
    (id = auth.uid())
);

-- POLICY 3: Trigger/Auto-insert
CREATE POLICY "Allow system insert"
ON users FOR INSERT
WITH CHECK (true);

-- STEP 4: APPLY DATA TABLE POLICIES (Simplest version)

-- ZONES
CREATE POLICY "Read zones" ON zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage zones" ON zones FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

-- ROADS
CREATE POLICY "Read roads" ON roads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage roads" ON roads FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

-- CASES
CREATE POLICY "Read cases" ON cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create cases" ON cases FOR INSERT TO authenticated WITH CHECK (true); -- App handles creator logic
CREATE POLICY "Manage cases" ON cases FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

-- STEP 5: FORCE SYNC YOUR ADMIN ROLE
-- This will trigger the sync to metadata
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

-- STEP 6: VERIFICATION
SELECT id, email, role FROM users WHERE id = 'a8470db4-b46f-4be0-baf3-2f8c5745a92a';
