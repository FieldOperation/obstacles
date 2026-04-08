-- ============================================
-- FINAL DIAGNOSTICS: RUN THIS NOW
-- ============================================
-- This script will tell us EXACTLY what is happening in the database.
-- ============================================

-- 1. Check for active Locks (This causes "Hanging")
SELECT 
    pid, 
    now() - query_start as duration, 
    wait_event_type, 
    wait_event, 
    state, 
    query 
FROM pg_stat_activity 
WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%';

-- 2. Check current RLS Status on all tables
SELECT 
    tablename, 
    rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'zones', 'roads', 'cases');

-- 3. Check if your user actually exists in the DB
SELECT id, email, role, 'IN_USERS_TABLE' as status
FROM users 
WHERE email = 'omar_oudat@hotmail.com'
UNION ALL
SELECT id, email, 'N/A', 'IN_AUTH_TABLE'
FROM auth.users
WHERE email = 'omar_oudat@hotmail.com';

-- 4. Check for any stuck triggers
SELECT 
    event_object_table as table_name, 
    trigger_name, 
    action_statement, 
    status 
FROM information_schema.triggers 
WHERE event_object_schema = 'public';

-- 5. TOTAL ROWS (Sanity check)
SELECT 'users' as tbl, count(*) FROM users
UNION ALL
SELECT 'zones', count(*) FROM zones
UNION ALL
SELECT 'roads', count(*) FROM roads
UNION ALL
SELECT 'cases', count(*) FROM cases;
