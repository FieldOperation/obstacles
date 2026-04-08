-- ============================================
-- 1) STORAGE: Allow case photo uploads
-- 2) USERS: Allow admins to insert/read/update/delete (no recursion)
-- ============================================
-- Run in Supabase Dashboard → SQL Editor after FIX_RLS_COMPLETE.sql
-- ============================================

-- ---------- STORAGE (fix "new row violates row-level security" on case create) ----------
DROP POLICY IF EXISTS "Authenticated users can upload to cases" ON storage.objects;
DROP POLICY IF EXISTS "Public can read cases" ON storage.objects;

CREATE POLICY "Authenticated users can upload to cases"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cases');

CREATE POLICY "Public can read cases"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'cases');

-- ---------- USERS: Helper so admin checks don't recurse ----------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN');
$$;

-- Admins can insert new users (e.g. when creating from Users page)
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users"
ON users FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Admins can read all users (list on Users page)
DROP POLICY IF EXISTS "Admins can read all users" ON users;
CREATE POLICY "Admins can read all users"
ON users FOR SELECT TO authenticated
USING (public.is_admin());

-- Admins can update any user
DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE TO authenticated
USING (public.is_admin());

-- Admins can delete users
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users"
ON users FOR DELETE TO authenticated
USING (public.is_admin());
