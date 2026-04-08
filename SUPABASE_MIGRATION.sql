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
-- Note: Adjust column names if your existing tables use camelCase

-- Zones Table
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roads Table
CREATE TABLE IF NOT EXISTS roads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_roads_zone_id ON roads(zone_id);

-- Developers Table
CREATE TABLE IF NOT EXISTS developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
-- Note: This should link to Supabase Auth users
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

-- Cases Table
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

-- Photos Table
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

-- Notifications Table
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

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_logo TEXT,
    owner_logo TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- Users Policies (drop first so migration can be re-run safely)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
ON users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

CREATE POLICY "Admins can update users"
ON users FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

CREATE POLICY "Admins can insert users"
ON users FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Zones Policies (Admin only)
DROP POLICY IF EXISTS "Admins can manage zones" ON zones;
DROP POLICY IF EXISTS "All authenticated users can read zones" ON zones;
CREATE POLICY "Admins can manage zones"
ON zones FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

CREATE POLICY "All authenticated users can read zones"
ON zones FOR SELECT
TO authenticated
USING (true);

-- Roads Policies (Admin only for write, all can read)
DROP POLICY IF EXISTS "Admins can manage roads" ON roads;
DROP POLICY IF EXISTS "All authenticated users can read roads" ON roads;
CREATE POLICY "Admins can manage roads"
ON roads FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

CREATE POLICY "All authenticated users can read roads"
ON roads FOR SELECT
TO authenticated
USING (true);

-- Developers Policies (Admin only for write, all can read)
DROP POLICY IF EXISTS "Admins can manage developers" ON developers;
DROP POLICY IF EXISTS "All authenticated users can read developers" ON developers;
CREATE POLICY "Admins can manage developers"
ON developers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

CREATE POLICY "All authenticated users can read developers"
ON developers FOR SELECT
TO authenticated
USING (true);

-- Cases Policies (Complex role-based)
DROP POLICY IF EXISTS "Users can view cases based on role" ON cases;
DROP POLICY IF EXISTS "Workers and admins can create cases" ON cases;
DROP POLICY IF EXISTS "Users can modify cases based on role" ON cases;
DROP POLICY IF EXISTS "Admins can delete cases" ON cases;
CREATE POLICY "Users can view cases based on role"
ON cases FOR SELECT
USING (
    -- Admin sees all
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
    OR
    -- Worker with zone sees cases in their zone
    (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NOT NULL
        )
        AND zone_id IN (
            SELECT zone_id FROM users WHERE id = auth.uid()
        )
    )
    OR
    -- Worker without zone sees own cases
    (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NULL
        )
        AND created_by_id = auth.uid()
    )
    OR
    -- Others role sees all (read-only)
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'OTHERS'
    )
);

CREATE POLICY "Workers and admins can create cases"
ON cases FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')
    )
    AND created_by_id = auth.uid()
);

CREATE POLICY "Users can modify cases based on role"
ON cases FOR UPDATE
USING (
    -- Admin can modify any
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
    OR
    -- Worker can modify own cases or cases in their zone
    (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'WORKER'
        )
        AND (
            created_by_id = auth.uid()
            OR (
                zone_id IN (
                    SELECT zone_id FROM users 
                    WHERE id = auth.uid() AND zone_id IS NOT NULL
                )
            )
        )
    )
);

CREATE POLICY "Admins can delete cases"
ON cases FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Photos Policies (based on case access)
DROP POLICY IF EXISTS "Users can view photos of accessible cases" ON photos;
DROP POLICY IF EXISTS "Workers and admins can insert photos" ON photos;
CREATE POLICY "Users can view photos of accessible cases"
ON photos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = photos.case_id
        AND (
            -- Admin sees all
            EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid() AND role = 'ADMIN'
            )
            OR
            -- Worker with zone sees cases in their zone
            (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NOT NULL
                )
                AND cases.zone_id IN (
                    SELECT zone_id FROM users WHERE id = auth.uid()
                )
            )
            OR
            -- Worker without zone sees own cases
            (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE id = auth.uid() AND role = 'WORKER' AND zone_id IS NULL
                )
                AND cases.created_by_id = auth.uid()
            )
            OR
            -- Others role sees all
            EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid() AND role = 'OTHERS'
            )
        )
    )
);

CREATE POLICY "Workers and admins can insert photos"
ON photos FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')
    )
);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- System Settings Policies (Admin only)
DROP POLICY IF EXISTS "Admins can manage settings" ON system_settings;
DROP POLICY IF EXISTS "All authenticated users can read settings" ON system_settings;
CREATE POLICY "Admins can manage settings"
ON system_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

CREATE POLICY "All authenticated users can read settings"
ON system_settings FOR SELECT
TO authenticated
USING (true);

-- Step 5: Create function to sync auth.users with users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        'OTHERS'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
