# Run these in Supabase SQL Editor — in order

Go to **Supabase Dashboard → SQL Editor → New Query**. Run **Query 1** first, then **Query 2**.

---

## Query 1: Main migration (tables, RLS, trigger)

Run this first. It creates enums, tables, indexes, enables RLS, and adds policies + auth sync trigger.

```sql
-- ============================================
-- SUPABASE MIGRATION SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create Enums (if they don't exist)
DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('ADMIN', 'WORKER', 'OTHERS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_status_enum AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_type_enum AS ENUM ('OBSTACLE', 'DAMAGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create Tables (if they don't exist)
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, zone_id)
);
CREATE INDEX IF NOT EXISTS idx_roads_zone_id ON roads(zone_id);

CREATE TABLE IF NOT EXISTS developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role role_enum DEFAULT 'OTHERS',
    zone_id UUID REFERENCES zones(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type case_type_enum NOT NULL,
    status case_status_enum DEFAULT 'OPEN',
    zone_id UUID REFERENCES zones(id),
    road_id UUID REFERENCES roads(id),
    developer_id UUID REFERENCES developers(id),
    description TEXT NOT NULL,
    planned_work TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_by_id UUID REFERENCES users(id),
    closed_by_id UUID REFERENCES users(id),
    closed_at TIMESTAMPTZ,
    closure_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(type);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_zone_id ON cases(zone_id);
CREATE INDEX IF NOT EXISTS idx_cases_road_id ON cases(road_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_by_id ON cases(created_by_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);

CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    closure_case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_photos_case_id ON photos(case_id);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_logo TEXT,
    owner_logo TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Step 3: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies (other tables; users table fixed in Query 2)
-- Zones
CREATE POLICY "Admins can manage zones" ON zones FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "All authenticated users can read zones" ON zones FOR SELECT TO authenticated USING (true);

-- Roads
CREATE POLICY "Admins can manage roads" ON roads FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "All authenticated users can read roads" ON roads FOR SELECT TO authenticated USING (true);

-- Developers
CREATE POLICY "Admins can manage developers" ON developers FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "All authenticated users can read developers" ON developers FOR SELECT TO authenticated USING (true);

-- Cases
CREATE POLICY "Users can view cases based on role" ON cases FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
    OR (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NOT NULL) AND zone_id IN (SELECT zone_id FROM users WHERE id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NULL) AND created_by_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OTHERS')
);
CREATE POLICY "Workers and admins can create cases" ON cases FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')) AND created_by_id = auth.uid());
CREATE POLICY "Users can modify cases based on role" ON cases FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
    OR (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'WORKER') AND (created_by_id = auth.uid() OR (zone_id IN (SELECT zone_id FROM users WHERE id = auth.uid() AND zone_id IS NOT NULL))))
);
CREATE POLICY "Admins can delete cases" ON cases FOR DELETE
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- Photos
CREATE POLICY "Users can view photos of accessible cases" ON photos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = photos.case_id
        AND (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
            OR (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NOT NULL) AND cases.zone_id IN (SELECT zone_id FROM users WHERE id = auth.uid()))
            OR (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NULL) AND cases.created_by_id = auth.uid())
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OTHERS')
        )
    )
);
CREATE POLICY "Workers and admins can insert photos" ON photos FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')));

-- Notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- System Settings
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "All authenticated users can read settings" ON system_settings FOR SELECT TO authenticated USING (true);

-- Step 5: Auth sync trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'OTHERS');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Note:** If you get "policy already exists" on any table, you may have run the migration before. You can skip to Query 2 for the users table fix, or drop existing policies first.

---

## Query 2: Users table RLS fix (no recursion)

Run this **after** Query 1. It removes recursive policies on `users` and leaves a single simple SELECT so profile load does not timeout.

```sql
-- ============================================
-- USERS TABLE RLS FIX (run after migration)
-- ============================================

-- Drop ALL existing policies on users (clean slate)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;

-- Single simple SELECT: user can only read their own row (no recursion)
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Optional: allow users to update their own profile (e.g. name)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Allow trigger to insert new users (auth sync)
CREATE POLICY "Allow trigger to insert users"
ON users FOR INSERT
WITH CHECK (true);
```

**Important:** The migration in Query 1 creates extra policies on `users` that can cause recursion/timeouts. Query 2 replaces them with one simple SELECT so the app can load the profile reliably.

---

## After running both

1. Create storage buckets `cases` and `logos` (Storage → New Bucket) and add policies — see `QUICK_START_CHECKLIST.md`.
2. Create at least one user in **Authentication → Users**, then set their `role` in the **users** table to `ADMIN` (e.g. via Table Editor or `CREATE_ADMIN_USER.sql`).
