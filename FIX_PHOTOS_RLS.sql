-- ============================================
-- FIX: "new row violates row-level security policy for table photos"
-- ============================================
-- Run in Supabase Dashboard → SQL Editor
-- Allows WORKER and ADMIN to insert rows into photos when creating a case.
-- ============================================

-- Helper: check if current user is WORKER or ADMIN (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_worker_or_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN'));
$$;

-- Drop existing INSERT policy on photos (name may vary)
DROP POLICY IF EXISTS "Workers and admins can insert photos" ON photos;

-- Allow authenticated WORKER/ADMIN to insert photos
CREATE POLICY "Workers and admins can insert photos"
ON photos FOR INSERT TO authenticated
WITH CHECK (public.is_worker_or_admin());
